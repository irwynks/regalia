const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");
const axios = require("axios");

let NFT = new Schema(
    {
        name: { type: String, default: "" },
        mintAddress: { type: String, required: true },
        firstCreatorAddress: { type: String, required: true },
        symbol: { type: String, default: "" },
        updateAuthority: { type: String, default: "" },
        creators: { type: [Schema.Types.Mixed], default: [] },
        image_url: { type: String, default: '/nft-placeholder.png' },
        attributes: { type: [Schema.Types.Mixed], default: [] },
        currentOwner: String
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

module.exports = NFT