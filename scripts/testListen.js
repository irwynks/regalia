const RPC = require('../utils/classes/class.rpc');
const Transaction = require('../utils/classes/class.transaction');

let parsed = {};

(async () => {

    const connection = new RPC({
        rpcURL: 'https://black-twilight-sun.solana-mainnet.quiknode.pro/71aab5c2a5b9a18895ab62e905f01425186811a1/',
        wsURL: 'wss://black-twilight-sun.solana-mainnet.quiknode.pro/71aab5c2a5b9a18895ab62e905f01425186811a1/',
        commitment: 'finalized'
    })

    let ws = connection.initializeWS()
    let slug = connection.getSubscriptionSlug('magiceden');

    ws.on("open", function open() {
        ws.send(JSON.stringify(slug));
        //listen for messages coming in and send if signature is present.
        ws.on("message", async (data) => {
            data = JSON.parse(data.toString())
            if (!!data.params) {
                console.log(data.params);
                console.log(JSON.stringify(data));
                data.provider = 'magiceden';
                let tx = new Transaction(data)
                await tx.parse();
                if (['buyNow', 'bidAccept'].includes(tx.parsed.type))
                    console.log(tx);
                //await tx.save();
            }
        })
    })

})();