const parser = require('../../utils/parser');
const db = require('../models/model.main');

class Transaction {
    constructor(data) {
        Object.assign(this, data);
    };

    parse = async () => {
        let parsed = await parser[this.provider](this);
        this.parsed = { ...parsed };
    }

    save = async () => {
        console.log(this);
        try {
            let tx = new db.transactions(this.parsed);
            await tx.save()
        } catch (err) {
            console.log(err);
        } finally {
            return;
        }
    }
}

module.exports = Transaction;