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

                        console.log("Getting transactions for", firstCreatorAddress)

                        //Get hashlist from cache, if not available get from API
                        let mintAddresses = await rclient.smembers(`hashlist:${firstCreatorAddress}`)

                        console.log(mintAddresses);

                        if (!!!mintAddresses || !!!mintAddresses.length) {
                            console.log('Getting hashlist from API');
                            mintAddresses = await solana.getHashlist(firstCreatorAddress);
                            await rclient.sadd(`hashlist:${firstCreatorAddress}`, mintAddresses)
                        }

                        //Scrape hashes. 
                        await PromisePool.withConcurrency(5)
                            .for(mintAddresses)
                            .process(async (mintAddress) => {
                                try {
                                    let success = false;
                                    while (!success) {
                                        try {

                                            await getTransactionData(mintAddress);
                                            success = true;
                                            await wait(100);

                                        } catch (err) {
                                            console.log(err.code);
                                            success = false;
                                            await wait(1000);
                                        }
                                    }
                                } catch (err) {
                                    console.log(err);
                                }
                            })
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

                                        //Find tx for this NFT if it hasn't been found.
                                        let tx = await getTransactionData(nft.mintAddress);
                                        nft.tx = !!tx ? tx : null;

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

                        user.set('nfts', _.uniq(addToUser));
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

    }

}

const getTransactionData = async () => {
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