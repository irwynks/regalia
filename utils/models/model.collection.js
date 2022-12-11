const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");
const axios = require("axios");
const nfts = require('./model.nft')
const random = require("randomatic");

let Collection = new Schema({
    name: String,
    firstCreatorAddress: String,
    symbol: String,
    updateAuthority: String,
    linkedServer: String,
    vault: String
}, { strict: false })

Collection.index({ firstCreatorAddress: 1 });
Collection.index({ vault: 1 });

module.exports = Collection;