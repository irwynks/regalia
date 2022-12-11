require("dotenv").config({ path: "../.env" });

const worker = require('./workers/worker.crawl');
const rclient = require("../utils/redis");
const cron = require("node-cron");

const poll = require('./workers/worker.poll');

let dequeueing = false;
let polling = false;

cron.schedule(`* */10 * * * *`, async () => {
    if (!polling) {
        polling = true;
        await poll.helius()
        polling = false;
    }
}, { scheduled: true })

const dequeue = async () => {
    try {
        dequeueing = true;
        do {
            const raw = await rclient.rpop(`ingest.queue`)
            dequeueing = !!raw;
            if (!!raw) {
                let slug = JSON.parse(raw);
                let { action, data } = slug;
                worker[action](data);
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

})()