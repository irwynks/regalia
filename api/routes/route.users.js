const rclient = require('../../utils/redis');
const mdl = require("../../utils/middleware");
const axios = require("axios");
const qs = require("qs");
const db = require("../../utils/models/model.main");
const _ = require("lodash");

const icons = 'https://cdn.discordapp.com/icons'
const avatars = 'https://cdn.discordapp.com/avatars'

const { DISCORD_CLIENT_ID, DISCORD_SECRET } = process.env;

console.table({ DISCORD_CLIENT_ID, DISCORD_SECRET })

const random = require("randomatic");
const nacl = require("tweetnacl");
const bs58 = require("bs58");

const { Metaplex, Metadata } = require("@metaplex-foundation/js");
const { Connection, PublicKey } = require("@solana/web3.js");

const connection = new Connection(`https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`);
const metaplex = new Metaplex(connection);

module.exports = (router) => {

    router.route(`/v1/auth`)
        .get(async (req, res) => {
            let resp;
            try {

                let { code } = req.query;

                //Check if we have an access token cached. If not, get it from discord
                let access_token = await rclient.get(`user.access_token:${code}`)

                if (!!!access_token) {

                    let slug = {
                        client_id: DISCORD_CLIENT_ID,
                        client_secret: DISCORD_SECRET,
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: 'https://regalia.live/auth'
                    };

                    let getToken = {
                        method: 'post',
                        url: 'https://discord.com/api/v10/oauth2/token',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
                        data: qs.stringify(slug)
                    }

                    let { data } = await axios(getToken);

                    access_token = data.access_token;
                    let expiry = data.expires_in;

                    //Cache access token
                    await rclient.setex(`user.access_token:${code}`, expiry, access_token);
                }

                let getIdentity = {
                    method: 'get',
                    url: 'https://discord.com/api/v10/users/@me',
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    },
                }

                let getGuilds = {
                    method: 'get',
                    url: 'https://discord.com/api/v10/users/@me/guilds',
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    },
                }

                let { data: user } = await axios(getIdentity);

                if (!!user.id) {
                    let { data: guilds } = await axios(getGuilds);

                    user.avatar_url = `${avatars}/${user.id}/${user.avatar}`

                    //Get servers owned by user
                    guilds = guilds.filter(g => !!g.owner).map(g => {
                        g.icon_url = `${icons}/${g.id}/${g.icon}`
                        delete g.features;
                        return g;
                    });

                    let found = await db.users.findOne({ discordId: user.id });

                    if (!!!found) {

                        let cleaned = _.pick(user, ['id', 'username', 'discriminator', 'avatar_url'])
                        cleaned.discordId = cleaned.id;
                        delete cleaned.id;

                        let newUser = new db.users(cleaned);
                        found = await newUser.save();

                    };

                    user = found.toJSON();

                    let session_id = await rclient.hget(`maps.userToSession`, user._id.toString());
                    if (!!!session_id) {
                        session_id = random('Aa0', 20);
                        await rclient.multi()
                            .hset(`maps.userToSession`, user._id.toString(), session_id)
                            .hset(`maps.sessionToUser`, session_id, user._id.toString())
                            .exec()
                    }


                    resp = {
                        success: true,
                        message: 'User authenticated.',
                        data: { user, guilds, session_id }
                    }

                } else {
                    resp = {
                        success: false,
                        message: 'User couldnt be authenticated.',
                        data: {}
                    }
                }

            } catch (err) {
                console.log(err)
                resp = {
                    success: false,
                    message: err,
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })

    router.route(`/v1/auth/nonce`)
        .get(async (req, res) => {
            let resp;
            try {

                let { pubkey } = req.query;

                if (!!pubkey) {

                    let nonce = random('0', 20);
                    await rclient.setex(`nonce:${pubkey}`, 60 * 10, nonce)

                    console.table({ pubkey, nonce })

                    resp = {
                        success: true,
                        message: 'Nonce generated.',
                        data: { nonce }
                    }

                } else {
                    resp = {
                        success: false,
                        message: 'Missing user wallet address.',
                        data: {}
                    }
                }

            } catch (err) {
                console.log(err)
                resp = {
                    success: false,
                    message: err,
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })

    router.route(`/v1/auth/signed`)
        .post(async (req, res) => {
            let resp;
            try {

                let { encoded, pubkey } = req.body;

                if (!!pubkey) {

                    let nonce = await rclient.get(`nonce:${pubkey}`);

                    const signatureUint8 = bs58.decode(encoded);
                    const nonceUint8 = new TextEncoder().encode(nonce);
                    const pubKeyUint8 = bs58.decode(pubkey);

                    let ok = nacl.sign.detached.verify(nonceUint8, signatureUint8, pubKeyUint8)

                    if (!!ok) {
                        let found = await db.users.findOne({ pubkey })
                            .populate('nfts')

                        if (!!!found) {
                            let newUser = new db.users({ pubkey });
                            found = await newUser.save();

                            const nfts = await metaplex.nfts().findAllByOwner({ owner: new PublicKey(pubkey) });

                            let mintAccounts = nfts.map(i => i.mintAddress);
                            let addToUser = [];

                            while (!!mintAccounts.length) {
                                let batch = mintAccounts.splice(0, 100)

                                let { data: meta } = await axios({
                                    method: 'post',
                                    url: `https://api.helius.xyz/v0/tokens/metadata?api-key=${process.env.HELIUS_API_KEY}`,
                                    data: { mintAccounts: batch }
                                })

                                for (let item of meta) {

                                    try {

                                        let { mint: mintAddress } = item;
                                        let { updateAuthority } = item.onChainData;
                                        let { creators } = item.onChainData.data;
                                        let { name, image: image_url, symbol, attributes } = item.offChainData;

                                        let firstCreator = creators.find(i => { return +i.share === 0 && !!i.verified });
                                        if (!!!firstCreator)
                                            firstCreator = creators.find(i => { return +i.share === 0 });
                                        if (!!!firstCreator)
                                            firstCreator = creators.find(i => { return !!i.verified });
                                        let firstCreatorAddress = firstCreator.address

                                        let nft = { name, mintAddress, firstCreatorAddress, symbol, updateAuthority, creators, image_url, attributes, currentOwner: lean.pubkey };

                                        let found = await db.nfts.findOne({ mintAddress });

                                        let { currentOwner: buyer } = nft;
                                        let [transaction] = await db.transactions.find({ buyer, mintAddress }).sort({ blocktime: -1 }).limit(1).lean();
                                        nft.tx = !!transaction ? transaction : null;

                                        if (!!found) {
                                            for (let [key, val] of Object.entries(nft)) {
                                                found.set(key, val);
                                            }
                                            await found.save();
                                        } else {
                                            let newNFT = new db.nfts(nft);
                                            found = await newNFT.save()
                                        }

                                        addToUser.push(found._id.toString());

                                    } catch (err) {
                                        if (/(Cannot read properties of null \(reading 'find'\))|(Cannot destructure property 'name' of 'item.offChainData')/i.test(err + '')) {
                                            console.error('Potentially a scam NFT')
                                            console.error(item.mint);
                                        } else {
                                            console.log(err)
                                            console.error(item.onChainData.data);
                                        }
                                    }

                                }
                            }

                            found.set('nfts', _.uniq(addToUser));
                            await found.save();


                            let slug = {
                                action: 'userWalletNFTs',
                                data: { pubkey }
                            }
                            await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        };

                        user = found.toJSON();
                        user.nfts = user.nfts.sort()

                        let collections = await db.collections.find({}, { firstCreatorAddress: 1 }).lean()
                        collections = collections.map(i => i.firstCreatorAddress);
                        user.nfts = user.nfts.map(n => {
                            n.tracked = collections.includes(n.firstCreatorAddress) && !!n.tx;
                            return n;
                        });

                        let session_id = await rclient.hget(`maps.userToSession`, user._id.toString());
                        if (!!!session_id) {
                            session_id = random('Aa0', 20);
                            await rclient.multi()
                                .hset(`maps.userToSession`, user._id.toString(), session_id)
                                .hset(`maps.sessionToUser`, session_id, user._id.toString())
                                .exec()
                        }

                        resp = {
                            success: true,
                            message: 'Verified.',
                            data: { session_id, user, guilds: [] }
                        }

                    } else {

                        resp = {
                            success: false,
                            message: 'Invalid signature.',
                            data: {}
                        }

                    }

                } else {
                    resp = {
                        success: false,
                        message: 'Missing user wallet address.',
                        data: {}
                    }
                }

            } catch (err) {
                console.log(err)
                resp = {
                    success: false,
                    message: err,
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })

    router.route(`/v1/user`)
        .get(mdl.authUser, async (req, res) => {

            let resp;
            try {

                let userId = req.user.id;

                let user = await db.users.findOne({ _id: userId }).populate('nfts');

                if (!!user) {

                    let collections = await db.collections.find({}, { firstCreatorAddress: 1 }).lean()
                    collections = collections.map(i => i.firstCreatorAddress);
                    user.nfts = user.nfts.map(n => {
                        n.tracked = collections.includes(n.firstCreatorAddress) && !!n.tx;;
                        return n;
                    })

                    resp = {
                        success: true,
                        message: 'User retrieved.',
                        data: user.toJSON()
                    }

                } else {
                    resp = {
                        success: false,
                        message: 'Could not find user.',
                        data: {}
                    }
                }

            } catch (err) {
                console.log(err);
                resp = {
                    success: false,
                    message: 'An error occurred.',
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })
        .put(mdl.authUser, async (req, res) => {
            let resp;
            try {

                let data = req.body;
                let userId = req.user.id;

                let user = await db.users.findOne({ _id: userId })

                if (data.collections)
                    data.collections = _.uniqBy(data.collections, 'firstCreatorAddress');

                for (let [key, val] of Object.entries(data)) {
                    user.set(key, val);
                }

                for (let collection of data.collections) {
                    let c = await db.collections.findOne({ firstCreatorAddress: collection.firstCreatorAddress })
                    for (let [key, val] of Object.entries(collection)) {
                        c.set(key, val);
                    }
                    await c.save();
                }

                console.error(data);
                let force = true;
                for (let { firstCreatorAddress: fca } of data.collections) {
                    let status = await rclient.hget('collections.status', fca)
                    if (!!force && !/scraping/ig.test(status)) {
                        let slug = {
                            action: 'scrape',
                            data: { address: fca }
                        }
                        await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        data[fca] = 'Scraping (Forced)';
                    } else if (!!!status) {
                        let slug = {
                            action: 'scrape',
                            data: { address: fca }
                        }
                        await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        data[fca] = 'Scraping';
                    } else {
                        data[fca] = status;
                    }
                };

                let saved = await user.save();

                await saved.populate('nfts');

                user = await db.users.findOne({ _id: userId }).populate('nfts');

                let collections = await db.collections.find({}, { firstCreatorAddress: 1 }).lean()
                collections = collections.map(i => i.firstCreatorAddress);
                user.nfts = user.nfts.map(n => {
                    n.tracked = collections.includes(n.firstCreatorAddress) && !!n.tx;;
                    return n;
                })

                resp = {
                    success: true,
                    message: 'User updated.',
                    data: user.toJSON()
                }

            } catch (err) {
                console.log(err);
                resp = {
                    success: false,
                    message: 'An error occurred.',
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })

    router.route(`/v1/user/nfts`)
        .get(mdl.authUser, async (req, res) => {

            let resp;
            try {

                let userId = req.user.id;

                let user = await db.users.findOne({ _id: userId }).populate('nfts').lean()

                if (!!user) {
                    let nfts = user.nfts;
                    let collections = await db.collections.find({}, { firstCreatorAddress: 1 }).lean()
                    collections = collections.map(i => i.firstCreatorAddress);
                    nfts = nfts.map(n => {
                        n.tracked = collections.includes(n.firstCreatorAddress) && !!n.tx;;
                        return n;
                    })

                    resp = {
                        success: true,
                        message: 'NFTs retrieved.',
                        data: nfts
                    }

                } else {
                    resp = {
                        success: false,
                        message: 'Could not find user.',
                        data: {}
                    }
                }

            } catch (err) {
                console.log(err);
                resp = {
                    success: false,
                    message: 'An error occurred.',
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })
}