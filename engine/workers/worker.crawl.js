const solana = require("../../utils/solana");
const parser = require("../../utils/parser");
const db = require('../../utils/models/model.main');
const rclient = require('../../utils/redis');
const Transaction = require('../../utils/classes/class.transaction')
const { PromisePool } = require("@supercharge/promise-pool");
const axios = require('axios');

const wait = require('node:timers/promises').setTimeout;

module.exports = {

    deprecated_scrape: async (data) => {
        try {

            let { address } = data;

            await rclient.hset('collections.status', address, 'Scraping')
            //Get hashlist. 
            let mintAddresses = await solana.getHashlist(address);
            //Scrape hashes. 
            await PromisePool.withConcurrency(5)
                .for(mintAddresses)
                .process(async (mintAddress) => {

                    let success = false;
                    while (!!!success) {
                        try {
                            let url = `https://api.helius.xyz/v0/addresses/${mintAddress}/transactions?api-key=${process.env.HELIUS_API_KEY}&commitment=finalized&type=NFT_SALE`

                            let { data } = await axios({ url, method: 'get' })

                            if (!!data.length) {
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
                            } else {
                                console.log('No new transactions for', mintAddress);
                            }

                            success = true;
                            await wait(100);

                        } catch (err) {
                            console.log(err);
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
    },

    scrape: async (data) => {
        try {

            let { address } = data;

            await rclient.hset('collections.status', address, 'Scraping');

            let paginationToken = "";

            await getNFTs(address);

            do {

                try {
                    let config = {
                        method: 'post',
                        url: `https://api.helius.xyz/v1/nft-events?api-key=${process.env.HELIUS_API_KEY}`,
                        data: {
                            "query": {
                                "sources": [],
                                "types": ["NFT_SALE"],
                                "nftCollectionFilters": {
                                    "firstVerifiedCreator": [address]
                                }
                            },
                            "options": {
                                "limit": 500,
                                "sortOrder": "DESC",
                            }
                        }
                    }

                    if (!!paginationToken) config.data.options.paginationToken = paginationToken;

                    let { data } = await axios(config);

                    let { result } = data;
                    paginationToken = data.paginationToken;

                    if (!!result.length) {
                        await PromisePool.withConcurrency(20)
                            .for(result)
                            .process(async (item) => {

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

            await rclient.hset('collections.status', address, 'Complete')

        } catch (err) {
            console.log(err);
        } finally {
            return;
        }
    }

}

const getNFTs = async (firstCreatorAddress) => {

    try {

        const url = `https://api.helius.xyz/v1/mintlist?api-key=${process.env.HELIUS_API_KEY}`

        const { data: mintlist } = await axios.post(url, {
            "query": {
                "firstVerifiedCreators": [firstCreatorAddress]
            },
            "options": {
                "limit": 10000
            }
        });

        let mintAddresses = mintlist.result.map(i => i.mint);

        let untracked = [];
        await PromisePool.withConcurrency(20)
            .for(mintAddresses)
            .process(async (mintAddress) => {
                let found = await db.nfts.exists({ mintAddress });
                if (!!!found)
                    untracked.push(mintAddress);
            });

        while (!!untracked.length) {
            let batch = untracked.splice(0, 100)

            let { data: meta } = await axios({
                method: 'post',
                url: `https://api.helius.xyz/v0/tokens/metadata?api-key=${process.env.HELIUS_API_KEY}`,
                data: { mintAccounts: batch }
            })

            await PromisePool.withConcurrency(20)
                .for(meta)
                .process(async (item) => {

                    try {

                        let { mint: mintAddress } = item;
                        let { updateAuthority } = item.onChainData;
                        let { creators } = item.onChainData.data;
                        let { name, image: image_url, symbol, attributes } = item.offChainData;

                        let nft = { name, firstCreatorAddress, mintAddress, symbol, updateAuthority, creators, image_url, attributes, currentOwner: null, tx: null };

                        let newNFT = new db.nfts(nft);
                        found = await newNFT.save()

                    } catch (err) {
                        if (/(Cannot read properties of null \(reading 'find'\))|(Cannot destructure property 'name' of 'item.offChainData')/i.test(err + '')) {
                            console.error('Potentially a scam NFT')
                            console.error(item.mint);
                        } else {
                            console.log(err)
                            console.error(item.onChainData.data);
                        }
                    }
                })
        }

    } catch (err) {
        console.log(err);
    } finally {
        return;
    }

}