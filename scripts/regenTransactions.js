const db = require("../utils/models/model.main");

(async () => {

    try {
        let txs = await db.transactions.find();
        for (let tx of txs) {
            await tx.save();
        }
    } catch (err) {
        console.log(err)
    }

})()