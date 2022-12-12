const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");

let Payment = new Schema(
    {
        hash: { type: String, required: true },
        blocktime: String,
        payer: { type: String, required: true },
        destination: { type: String, required: true },
        amount: { type: Number, required: true },
        purpose: { type: String, enum: ['onboarding', 'royalty', 'orphaned'], required: true },

        //In the case of a royaltypayment, we need the owner of the NFT and the mintAddress
        buyer: { type: String },
        mintAddress: { type: String },

        linked: { type: Boolean, default: false }
    },
    { toJSON: { virtuals: true } }
);


Payment.index({ hash: 1 });
Payment.index({ payer: 1 });
Payment.index({ buyer: 1 });
Payment.index({ seller: 1 });

Payment.pre("save", function (next) {
    try {
        let now = moment().toDate();
        this.updatedAt = now;
        if (!this.createdAt) this.createdAt = now;
        next();
    } catch (err) {
        console.log(err);
    }
});

Payment.post("save", async function (doc, next) {
    try {

    } catch (err) {
        console.log(err);
    } finally {
        next();
    }
});

Payment.pre("deleteOne", { document: true, query: false }, async function (next) {
    next();
});

module.exports = Payment;
