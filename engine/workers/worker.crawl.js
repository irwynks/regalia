const solana = require("../../utils/solana");
const parser = require("../../utils/parser");
const db = require('../../utils/models/model.main');
const rclient = require('../../utils/redis');
const Transaction = require('../../utils/classes/class.transaction')
const { PromisePool } = require("@supercharge/promise-pool");
const axios = require('axios');

const wait = require('node:timers/promises').setTimeout;

module.exports = {

    scrape: async (data) => {
        try {

            console.log(data);

            let { address } = data;

            await rclient.hset('collections.status', address, 'Scraping')
            //Get hashlist. 
            let mintAddresses = await solana.getHashlist(address);
            //Scrape hashes. 
            await PromisePool.withConcurrency(10)
                .for(mintAddresses)
                .process(async (mintAddress) => {

                    let success = false;
                    while (!success) {
                        try {
                            let url = `https://api.helius.xyz/v0/addresses/${mintAddress}/transactions?api-key=${process.env.HELIUS_API_KEY}&commitment=finalized&type=NFT_SALE`

                            let { data } = await axios({
                                url,
                                method: 'get'
                            })

                            for (let item of data) {
                                let hash = item.signature;
                                let exists = await db.transactions.exists({ hash });

                                if (!!!exists) {
                                    let parsed = await parser.parseTransactionsHelius(item);
                                    let tx = new Transaction({ parsed })
                                    await tx.save()
                                } else {
                                    console.log('Transaction already logged.')
                                }
                            }

                            success = true;
                        } catch (err) {
                            console.log(err.code);
                            success = false;
                            await wait(1000);
                        }
                    }
                })

            await rclient.hset('collections.status', address, 'Complete')

        } catch (err) {
            console.log(err);
        } finally {
            return;
        }
    }

}