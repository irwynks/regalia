const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require("moment");
const rclient = require("../redis");
const axios = require("axios");
const nfts = require('./model.nft')
const random = require("randomatic");

const Collection = require("./model.collection");
//Identifiers schema
/*
    amount,
    firstCreatorAddress,
    payer_wallets
*/

let User = new Schema(
    {
        pubkey: { type: String, required: true, unique: true },
        discordId: { type: String, unique: true },
        username: String,
        discriminator: String,
        avatar_url: String,

        guild: { type: String },

        authorizedCollections: { type: [String], default: [] },
        collections: { type: [Collection], default: [] },
        wallets: { type: [String], default: [] },

        vaults: { type: [String] },
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

User.methods.populateMeta = async function () {
    let lean = this.toJSON();
    try {
        await Promise.all([
            new Promise(async (resolve, reject) => {
                let i = 0;
                for (let nft of lean.nfts_solana) {
                    console.error(nft);
                    let meta = await nfts.findOne({ mint: nft });
                    if (!!meta) {
                        lean.nfts_solana[i] = meta;
                    } else {
                        lean.nfts_solana.splice(i, 1);
                    }
                    i += 1;
                }
                resolve()
            }),
            new Promise(async (resolve, reject) => {
                let i = 0;
                for (let nft of lean.nfts_eth) {
                    console.error(nft);
                    let meta = await nfts.findOne({ mint: nft });
                    if (!!meta) {
                        lean.nfts_eth[i] = meta;
                    } else {
                        lean.nfts_eth.splice(i, 1);
                    }
                    i += 1;
                }
                resolve()
            })
        ])

        //console.error(lean);
        lean.nfts = [...lean.nfts_solana, ...lean.nfts_eth];

        return lean;

    } catch (err) {
        console.log(err)
    }
};


User.pre("save", function (next) {
    try {
        let now = moment().toDate();
        this.updatedAt = now;
        if (!this.createdAt) this.createdAt = now;
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
