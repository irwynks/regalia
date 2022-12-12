const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require('../redis');
const _ = require('lodash');
const Payment = require("./model.payment")

let Transaction = new Schema(
    {
        hash: { type: String, unique: true },
        firstCreatorAddress: String,
        mintAddress: String,
        blocktime: String,
        blockdate: Date,

        buyer: { type: String, required: true },
        seller: { type: String, required: true },

        royaltyPercent: Number,
        saleAmount: Number,
        royaltyAmount: Number,
        royaltyPaid: Number,
        royaltyPaidPercent: Number,
        marketplace: String,
        type: String,

        effectiveRoyaltyPaid: Number,
        effectiveRoyaltyPaidPercent: Number,

        fulfilled: { type: Boolean, default: false },
        linkedPayments: { type: [Schema.Types.Mixed], default: [] }
    },
    { strict: false, toJSON: { virtuals: true } }
);

Transaction.index({ firstCreatorAddress: 1 });
Transaction.index({ mintAddress: 1 });
Transaction.index({ mintAddress: 1, buyer: 1 });
Transaction.index({ mintAddress: 1, buyer: 1, blocktime: -1 });
Transaction.index({ buyer: 1 });
Transaction.index({ seller: 1 });

Transaction.pre("save", function (next) {
    let data = this.toJSON();
    this.blockdata = moment.unix(this.blocktime).toDate();

    this.royaltyAmount = (+data.royaltyPercent / 100) * +data.saleAmount;
    this.royaltyPaidPercent = Math.round((+data.royaltyPaid / +this.royaltyAmount) * 100);

    if (!!!this.effectiveRoyaltyPaid)
        this.effectiveRoyaltyPaid = this.royaltyPaid;
    this.effectiveRoyaltyPaidPercent = Math.round((+data.effectiveRoyaltyPaid / +this.royaltyAmount) * 100);

    if (!!!this.fulfilled)
        this.fulfilled = +this.royaltyPaidPercent >= 95;

    next();
});

Transaction.post("save", async function (doc) {
    try {
        let data = doc.toJSON();
        let { hash, blocktime, firstCreatorAddress, buyer, fees, saleAmount, royaltyPaid, royaltyPaidPercent } = data;

        //Save user information on TX, royalty paid, and percentage royalty paid.
        let key = `stats.byFCA:${firstCreatorAddress}`
        let update = JSON.parse((await rclient.hget(key, buyer)) || "[]");

        update.push({ hash, blocktime, firstCreatorAddress, buyer, saleAmount, fees, royaltyPaid, royaltyPaidPercent });
        update = _.uniqBy(update, 'hash');

        await rclient.hset(key, buyer, JSON.stringify(update));
    } catch (err) {
        console.log(err);
    } finally {
        return;
    }

})

module.exports = mongoose.model("Transaction", Transaction, "transactions");
