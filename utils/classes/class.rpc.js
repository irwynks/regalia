const { Connection } = require("@solana/web3.js");
const WebSocket = require("ws");

class RPC {
    constructor(data) {
        let { rpcURL, wsURL, commitment = 'confirmed' } = data;
        Object.assign(this, { rpcURL, wsURL, commitment });
        console.log(this);
    };

    initializeWS = () => {
        const ws = new WebSocket(this.wsURL, {
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3,
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024,
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
                threshold: 1024,
            },
        });

        return ws;
    };

    initializeRPC = () => {
        return new Connection(rpcURL);
    };

    getSubscriptionSlug = (provider) => {
        if (provider === 'magiceden') {
            return {
                jsonrpc: "2.0", id: 1, method: "logsSubscribe",
                params: [
                    { mentions: ["M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"], },
                    { encoding: 'base64', commitment: this.commitment, },
                ],
            }
        } else {
            throw 'Provider not supported.';
        }
    };

}

module.exports = RPC;
