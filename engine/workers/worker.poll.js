const solana = require("../../utils/solana");
const parser = require("../../utils/parser");
const db = require('../../utils/models/model.main');
const rclient = require('../../utils/redis');

const _ = require('lodash');

const Transaction = require('../../utils/classes/class.transaction')
const { PromisePool } = require("@supercharge/promise-pool");

const axios = require('axios');

const { Metaplex, Metadata } = require("@metaplex-foundation/js");
const { Connection, PublicKey } = require("@solana/web3.js");

const connection = new Connection(`https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`);
const metaplex = new Metaplex(connection);

const moment = require("moment");

const wait = require('node:timers/promises').setTimeout;

module.exports = {

    transactions: async () => {
        try {

            //Get collections that are being watched. 
            let collections = await db.collections.find({}).lean();

            console.log('Polling helius..')

            await PromisePool
                .for(collections)
                .withConcurrency(5)
                .process(async (collection) => {

                    try {
                        let { firstCreatorAddress } = collection;

                        let [lastTransaction] = await db.transactions.find({ firstCreatorAddress }).sort({ blocktime: -1 }).limit(1).lean();
                        console.log(lastTransaction);
                        let startTime = +lastTransaction.blocktime - 10;
                        let endTime = moment().unix()

                        console.log(startTime, endTime);

                        let paginationToken = "";
                        console.log(paginationToken);

                        do {

                            try {
                                let config = {
                                    method: 'post',
                                    url: `https://api.helius.xyz/v1/nft-events?api-key=${process.env.HELIUS_API_KEY}`,
                                    data: {
                                        "query": {
                                            "sources": [],
                                            "types": ["NFT_SALE"],
                                            startTime,
                                            endTime,
                                            "nftCollectionFilters": {
                                                "firstVerifiedCreator": [firstCreatorAddress]
                                            }
                                        },
                                        "options": {
                                            "limit": 500,
                                        }
                                    }
                                }

                                if (!!paginationToken) config.data.options.paginationToken = paginationToken;

                                let { data } = await axios(config);

                                let { result } = data;
                                paginationToken = data.paginationToken;

                                console.log(result.length);

                                if (!!result.length) {
                                    await PromisePool.withConcurrency(20)
                                        .for(result)
                                        .process(async (item) => {

                                            try {

                                                let hash = item.signature;
                                                let found = await db.transactions.findOne({ hash });

                                                let mintAddress = item.nfts[0].mint;
                                                let nft = await db.nfts.findOne({ mintAddress: mintAddress });

                                                if (!!!found) {
                                                    let parsed = await parser.parseEventHelius(item);
                                                    console.error(parsed);
                                                    let tx = new Transaction({ parsed })
                                                    found = await tx.save()
                                                } else {
                                                    console.log('Transaction already logged.')
                                                }

                                                if (!!nft) {
                                                    console.log('Found NFT. Linking TX.')
                                                    let tx = nft.toJSON().tx
                                                    if (!!tx) {
                                                        if (+found.blocktime > +tx.blocktime) {
                                                            nft.set('currentOwner', found.buyer);
                                                            nft.set('tx', found.toJSON());
                                                        }
                                                        await nft.save();
                                                    }
                                                }

                                            } catch (err) {
                                                console.log(err);
                                            }

                                        })
                                } else {
                                    paginationToken = false;
                                }

                                await wait(100);

                            } catch (err) {
                                console.log(err);
                                console.log('API error, retrying in 1s')
                                await wait(1000);
                            }

                        } while (!!paginationToken)

                        await rclient.hset('collections.status', firstCreatorAddress, 'Complete')

                    } catch (err) {
                        console.log(err);
                    }

                })

        } catch (err) {
            console.log(err);
        } finally {
            return;
        }
    },

    //Get NFTs in user wallets and link transactions
    userWalletNFTs: async (pubkey) => {

        try {
            let query = {};
            if (!!pubkey)
                query.pubkey = pubkey;
            let users = await db.users.find(query);

            await PromisePool.withConcurrency(5)
                .for(users)
                .process(async (user) => {
                    try {
                        let lean = user.toJSON();

                        console.log('Getting from user', lean.pubkey)

                        const nfts = await metaplex.nfts().findAllByOwner({ owner: new PublicKey(lean.pubkey) });

                        let mintAccounts = nfts.map(i => i.mintAddress);
                        let found = await db.nfts.find({ mintAddress: { $in: mintAccounts } }, { mintAddress: 1 }).lean();

                        console.error(mintAccounts.length, 'FOUND', found.length, lean.pubkey);

                        let addToUser = [...found.map(i => i._id.toString())]

                        let newNFTs = _.difference(mintAccounts, found.map(i => i.mintAddress.toString()));

                        let filtered = [];

                        for (let mint of newNFTs) {
                            let scam = await rclient.sismember('nft.blacklist', mint);
                            if (!!!scam)
                                filtered.push(mint);
                        }

                        while (!!filtered.length) {
                            let batch = filtered.splice(0, 100);

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
                                        await rclient.sadd('nft.blacklist', item.mint);
                                        console.error(item.mint);
                                    } else {
                                        console.log(err)
                                        console.error(item.onChainData.data);
                                    }
                                    await wait(1000);
                                }

                            }
                            await wait(300)
                        }

                        user.set('nfts', _.uniq([...addToUser]));
                        await user.save();

                    } catch (err) {
                        console.log(err);
                    }
                })

        } catch (err) {
            console.log(err);
        } finally {
            return;
        }

    },

    linkTransactions: async () => {

        try {

            let users = await db.users.find().populate('nfts').lean();

            await PromisePool.withConcurrency(50)
                .for(users)
                .process(async (user) => {
                    try {
                        let { nfts } = user;

                        await PromisePool.withConcurrency(50)
                            .for(nfts)
                            .process(async (nft) => {

                                try {
                                    if (!!!nft.tx) {
                                        let { mintAddress } = nft;
                                        let found = await db.nfts.findOne({ mintAddress });

                                        let [tx] = await db.transactions.find({ mintAddress }).sort({ blocktime: -1 }).limit(1);

                                        if (!!tx) {
                                            found.set('tx', tx.toJSON());
                                            await found.save();
                                        }
                                    }
                                } catch (err) {
                                    console.log(err);
                                }

                            })

                    } catch (err) {
                        console.log(err)
                    }
                })

        } catch (err) {
            console.log(err);
        }

    }

}

const getTransactionData = async (mintAddress) => {
    //Get last logged sale and build request using symbol and update authority
    let [lastLogged] = await db.transactions.find({ mintAddress }).sort({ blocktime: -1 }).limit(1).lean()

    let url = `https://api.helius.xyz/v0/addresses/${mintAddress}/transactions?api-key=${process.env.HELIUS_API_KEY}&commitment=finalized&type=NFT_SALE`

    if (!!lastLogged) {
        //console.log(lastLogged)
        url = url + `&until=${lastLogged.hash}`
    } else {
        //console.log(mintAddress, 'not found.')
    }

    let { data } = await axios({ url, method: 'get' })

    console.log(data.length, 'transactions received from helius for', mintAddress)

    for (let item of data) {
        let hash = item.signature;
        let exists = await db.transactions.findOne({ hash });

        if (!!!exists) {

            let parsed = await parser.parseTransactionsHelius(item);

            let tx = new Transaction({ parsed })
            await tx.save()

            //If this is a new transaction, send to webhook
            let slug = {
                action: 'new_sale',
                data: {
                    ...tx.json()
                }
            }
            await rclient.lpush(`webhook.queue`, JSON.stringify(slug));
            return tx.json();
        } else {
            console.log('Transaction already logged.')
            return exists.toJSON()
        }
    }
}