const solana = require("../../utils/solana");
const parser = require("../../utils/parser");
const db = require('../../utils/models/model.main');
const rclient = require('../../utils/redis');
const Transaction = require('../../utils/classes/class.transaction')
const { PromisePool } = require("@supercharge/promise-pool");
const axios = require('axios');

module.exports = {

    coralcube: async () => {
        try {

            //Get collections that are being watched. 

            //Get last logged sale and build request using symbol and update authority


            console.log(data);

            let { address } = data;

            await rclient.hset('collections.status', address, 'Scraping')
            //Get hashlist. 
            let mintAddresses = await solana.getHashlist(address);
            //Scrape hashes. 
            await PromisePool.withConcurrency(5)
                .for(mintAddresses)
                .process(async (mintAddress) => {
                    try {



                    } catch (err) {
                        console.log(err.code);
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