require("dotenv").config({ path: "../.env" });
const solana = require('./solana');
const axios = require('axios');

const { LAMPORTS_PER_SOL, Connection } = require('@solana/web3.js');
const connection = new Connection(`https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`);

const wait = require('node:timers/promises').setTimeout;

let blank = {
    hash: null,
    firstCreatorAddress: null,
    mintAddress: null,
    blocktime: null,
    buyer: null,
    seller: null,
    royaltyPercent: null,
    saleAmount: 0,
    royaltyAmount: null,
    royaltyPaid: 0,
    royaltyPaidPercent: null,
};

module.exports = {
    magiceden: async (data) => {
        try {
            const { signature: hash, logs } = data.params.result.value;

            let type;

            //Check if this is a fail transaction
            let error = false;
            logs.forEach((log) => {
                /error/gim.test(log) ? (error = true) : null;
            });

            if (error) {
                return { ...blank, type: 'failed', };
            } else {
                Object.entries(magicedenLogsMap).forEach(([key, search]) => {
                    let rgx = new RegExp(search, "g");
                    rgx.test(logs[1]) ? (type = key) : null;
                });

                if (type === "listed")
                    if (logs.length > 30) type = "bidAccept";

                if (['buyNow', 'bidAccept'].includes(type)) {
                    console.error('Received', type)
                    let parsed = await magicedenParseSignatureHelius(hash, type);
                    return { ...parsed, type };
                } else {
                    return { ...blank, type, };
                }
            }
        } catch (err) {
            console.error('@parse ME tx', err)
            return false;
        }
    },
    parseEventHelius: async (data) => {
        let type = "buyNow";
        let parsed = { ...blank, type };

        try {

            let { nativeTransfers, timestamp, source, signature, nfts, buyer, seller, amount } = data;
            let nft = nfts[0];
            parsed.marketplace = source.toLowerCase().replace(/_/gm, '');
            parsed.hash = signature;
            parsed.blocktime = timestamp;
            parsed.mintAddress = nft.mint;

            parsed.buyer = buyer;
            parsed.seller = seller;
            parsed.saleAmount = +(+amount / LAMPORTS_PER_SOL).toLocaleString("en-EN", { maximumFractionDigits: 6, })

            let onChain = await solana.getNFT(parsed.mintAddress);

            parsed.royaltyPercent = onChain.royalties;
            parsed.royaltyAmount = +((+parsed.royaltyPercent / 100) * +parsed.saleAmount).toLocaleString("en-EN", { maximumFractionDigits: 6, });

            let creators = onChain.creators.map(i => i.address);

            parsed.firstCreatorAddress = nft.firstVerifiedCreator;

            for (let transfer of nativeTransfers) {
                if (creators.includes(transfer.toUserAccount)) {
                    parsed.royaltyPaid += +(+transfer.amount / LAMPORTS_PER_SOL).toLocaleString("en-EN", { maximumFractionDigits: 6, })
                }
            }

            parsed.royaltyPaidPercent = Math.round((+parsed.royaltyPaid / +parsed.royaltyAmount) * 100);

        } catch (err) {
            console.log(err)
        } finally {
            return parsed;
        }
    },
    parseTransactionsHelius: async (data) => {
        let type = "buyNow";
        let parsed = { ...blank, type };

        try {

            let { events, nativeTransfers, timestamp, source, signature } = data;

            parsed.marketplace = source.toLowerCase().replace(/_/gm, '');

            parsed.hash = signature;
            parsed.blocktime = timestamp;
            parsed.mintAddress = events.nft.nfts[0].mint;

            parsed.buyer = events.nft.buyer;
            parsed.seller = events.nft.seller;
            parsed.saleAmount = +(+events.nft.amount / LAMPORTS_PER_SOL).toLocaleString("en-EN", { maximumFractionDigits: 6, })

            let nft = await solana.getNFT(parsed.mintAddress);

            parsed.royaltyPercent = nft.royalties;
            parsed.royaltyAmount = +((+parsed.royaltyPercent / 100) * +parsed.saleAmount).toLocaleString("en-EN", { maximumFractionDigits: 6, });

            let creators = nft.creators.map(i => i.address);

            parsed.firstCreatorAddress = creators[0];

            for (let transfer of nativeTransfers) {
                if (creators.includes(transfer.toUserAccount)) {
                    console.log(transfer);
                    parsed.royaltyPaid += +(+transfer.amount / LAMPORTS_PER_SOL).toLocaleString("en-EN", { maximumFractionDigits: 6, })
                }
            }

            parsed.royaltyPaidPercent = Math.round((+parsed.royaltyPaid / +parsed.royaltyAmount) * 100);
        } catch (err) {
            console.log(err)
        } finally {
            return parsed;
        }
    }

}

const magicedenParseSignatureHelius = async (signature, type) => {
    let parsed = { ...blank, type, marketplace: 'magiceden' }
    try {

        let info = await getInfo(signature, type)
        let { mintAddress } = await magicedenGetImmediateData(info);

        parsed.mintAddress = mintAddress;

        //Check here if we are currently watching this collection.
        let isActive = true;

        if (isActive) {
            let nft = await solana.getNFT(mintAddress);

            let url = `https://api.helius.xyz/v0/transactions?api-key=${process.env.HELIUS_API_KEY}&commitment=confirmed`

            let { data } = await axios({
                url,
                method: 'post',
                data: {
                    transactions: [signature]
                }
            })

            let { events, nativeTransfers, timestamp } = data[0];

            parsed.hash = signature;
            parsed.blocktime = timestamp;
            parsed.mintAddress = events.nft.nfts[0].mint;
            parsed.buyer = events.nft.buyer;
            parsed.seller = events.nft.seller;
            parsed.saleAmount = +(+events.nft.amount / LAMPORTS_PER_SOL).toLocaleString("en-EN", { maximumFractionDigits: 6, })

            parsed.royaltyPercent = nft.royalties;
            parsed.royaltyAmount = +((+parsed.royaltyPercent / 100) * +parsed.saleAmount).toLocaleString("en-EN", { maximumFractionDigits: 6, });

            let creators = nft.creators.map(i => i.address);

            parsed.firstCreatorAddress = creators[0];

            for (let transfer of nativeTransfers) {
                if (creators.includes(transfer.toUserAccount)) {
                    console.log(transfer);
                    parsed.royaltyPaid += +(+transfer.amount / LAMPORTS_PER_SOL).toLocaleString("en-EN", { maximumFractionDigits: 6, })
                }
            }

            parsed.royaltyPaidPercent = Math.round((+parsed.royaltyPaid / +parsed.royaltyAmount) * 100);
            console.log(parsed);
        }
    } catch (err) {
        console.log(err);
    } finally {
        return parsed;
    }
}

const getInfo = async (signature, type) => {
    let received;
    try {
        while (!!!received) {
            let data = await connection.getTransaction(signature, { commitment: 'confirmed' });
            received = data;
            if (!!!received) {
                await wait(200)
            }
        }
        let message = received.transaction.message;
        message.accountKeys = message.accountKeys.map(i => i.toBase58())
        if (type === 'bidAccept')
            console.log('RECEIVED', signature, JSON.stringify(received.transaction.message));
        return received;
    } catch (err) {
        console.error('@getInfo', err)
        return false;
    }
}

const magicedenGetImmediateData = async (data) => {
    try {

        let mintAddress;

        let accounts = data.transaction.message.accountKeys;
        let accountMap = data.transaction.message.instructions[1].accounts;

        let mintIndex = +accountMap[2];

        mintAddress = accounts[mintIndex];

        return { mintAddress }

    } catch (err) {
        console.error('@parse ME info', err)
        return false;
    }

}

const magicedenLogsMap = {
    listed: ": Sell",
    delisted: ": CancelSell",
    buyNow: ": Deposit",
    bid: ": Buy",
    cancelBid: ": CancelBuy",
};
