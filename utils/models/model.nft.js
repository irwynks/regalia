const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");
const axios = require("axios");

let NFT = new Schema(
    {
        mint: { type: String, required: true },
        firstCreatorAddress: { type: String, required: true },
        symbol: String,
        updateAuthority: String,
        royaltyPaid: { type: Number, default: 0 },
        lastSalePrice: Number,
        currentOwnerAddress: String
    },
    { toJSON: { virtuals: true }, strict: false }
);

NFT.pre("save", function (next) {
    try {
        let now = moment().toDate();
        this.updatedAt = now;
        next();
    } catch (err) {
        console.log(err);
    }
});

NFT.post("save", async function (doc, next) {
    let data = doc.toJSON();
    try {
    } catch (err) {
        console.log(err);
    } finally {
        next();
    }
});

module.exports = mongoose.model("NFT", NFT, "nfts");