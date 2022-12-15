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

    string = () => {
        return JSON.stringify(this);
    };

    json = () => {
        return JSON.parse(JSON.stringify(this));
    };

    save = async () => {
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