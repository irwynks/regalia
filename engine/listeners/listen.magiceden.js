require("dotenv").config({ path: "../.env" });
const RPC = require('../../utils/classes/class.rpc');
const Transaction = require('../../utils/classes/class.transaction');

let parsed = {};

(async () => {

    const connection = new RPC({
        rpcURL: `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`,
        wsURL: `wss://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`,
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