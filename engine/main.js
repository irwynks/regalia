require("dotenv").config({ path: "../.env" });

const worker = require('./workers/worker.crawl');
const rclient = require("../utils/redis");
const cron = require("node-cron");

const poll = require('./workers/worker.poll');

let dequeueing = false;
let pollingTransactions = false;
let pollingOwnedNFTs = false;

const dequeue = async () => {
    try {
        dequeueing = true;
        do {
            const raw = await rclient.rpop(`ingest.queue`)
            dequeueing = !!raw;
            if (!!raw) {
                let slug = JSON.parse(raw);
                let { action, data } = slug;
                if (/userWalletNFTs/i.test(action)) {
                    await poll[action](data.pubkey)
                } else {
                    await worker[action](data);
                }
            }
        } while (!!dequeueing)
    } catch (err) {
        console.log(err);
        throw err;
    }
};

(async () => {
    //require('./listeners/listen.magiceden')
    cron.schedule(`*/1 * * * * *`, async () => {
        if (!dequeueing) { await dequeue() }
    }, { scheduled: true })

    cron.schedule(`* */5 * * * *`, async () => {
        if (!!!pollingTransactions) {
            pollingTransactions = true;
            await poll.transactions()
            pollingTransactions = false;
        }
    }, { scheduled: true })

    cron.schedule(`* */3 * * * *`, async () => {
        if (!!!pollingOwnedNFTs) {
            pollingOwnedNFTs = true;
            await poll.userWalletNFTs()
            pollingOwnedNFTs = false;
        }
    }, { scheduled: true })

})()