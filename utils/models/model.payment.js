const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");

let Payment = new Schema(
    {
        hash: { type: String, unique: true },
        identifier: { type: String, unique: true },
        payer: { type: String, unique: true },
        destination: { type: String, required: true },
        amount: { type: Number, required: true },
        purpose: { type: String, enum: ['onboarding', 'royalty'], required: true },

        //In the case of a royaltypayment, we need the owner of the NFT and the mintAddress
        buyer: { type: String },
        mintAddress: { type: String },

        linked: { type: Boolean, default: false },

        createdAt: Date,
        updatedAt: Date,
    },
    { toJSON: { virtuals: true } }
);

Payment.index({ hash: 1 });
Payment.index({ identifier: 1 });
Payment.index({ payer: 1 });
Payment.index({ buyer: 1 });
Payment.index({ mintAddress: 1 });
Payment.index({ purpose: 1, linked: 1 });

Payment.methods('link', async function () {

});

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
