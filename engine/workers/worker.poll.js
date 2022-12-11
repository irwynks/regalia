const solana = require("../../utils/solana");
const parser = require("../../utils/parser");
const db = require('../../utils/models/model.main');
const rclient = require('../../utils/redis');
const Transaction = require('../../utils/classes/class.transaction')
const { PromisePool } = require("@supercharge/promise-pool");
const axios = require('axios');

const wait = require('node:timers/promises').setTimeout;

module.exports = {

    helius: async () => {
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
                                                let exists = await db.transactions.exists({ hash });

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

                                                } else {
                                                    console.log('Transaction already logged.')
                                                }
                                            }

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
    }

}