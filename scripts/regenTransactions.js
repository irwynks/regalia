const db = require("../utils/models/model.main");

(async () => {

    try {
        let txs = await db.transactions.find();
        for (let tx of txs) {
            tx.set('fufilled', undefined)
            await tx.save();
        }
        console.log('Done');
    } catch (err) {
        console.log(err)
    }

})()