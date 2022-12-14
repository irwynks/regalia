const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");
const random = require("randomatic");
let nfts = require('./model.nft');
let Collection = require("./model.collection");

const _ = require("lodash");

let User = new Schema(
    {
        pubkey: { type: String, required: true, unique: true },
        discordId: { type: String },
        username: String,
        discriminator: String,
        avatar_url: String,

        authorizedCollections: { type: [String], default: [] },
        collections: { type: [Schema.Types.Mixed], default: [] },
        wallets: { type: [String], default: [] },

        nfts: { type: [Schema.Types.ObjectId], ref: 'NFT' },

        apikey: { type: String },

        lastChecked: { type: Date, default: null },
        roles: { type: [Schema.Types.Mixed], default: [] },

        createdAt: Date,
        updatedAt: Date
    },
    { toJSON: { virtuals: true }, strict: false }
);

User.index({ wallets: 1 });
User.index({ pubkey: 1 });
User.index({ vaults: 1 });
User.index({ discordId: 1 });
User.index({ collections: 1 });
User.index({ apikey: 1 });

User.pre("save", function (next) {
    let data = this.toJSON()
    try {
        let now = moment().toDate();
        this.updatedAt = now;

        this.wallets = _.uniq([...data.wallets, data.pubkey])

        this.nfts = _.uniq(data.nfts)

        if (!this.createdAt) this.createdAt = now;
        if (!!!this.apikey)
            this.apikey = random('Aa0', 25);
        next();
    } catch (err) {
        console.log(err);
    }
});

User.post("save", async function (doc, next) {
    let data = doc.toJSON();
    let { userId } = data;
    let batch = rclient.multi();
    try {
        batch.hset(`users`, userId, JSON.stringify(data));
        await batch.exec();

    } catch (err) {
        console.log(err);
    } finally {
        next();
    }
});

User.pre("deleteOne", { document: true, query: false }, async function (next) {
    next();
});

module.exports = mongoose.model("User", User, "users");
