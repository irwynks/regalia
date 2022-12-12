require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://localhost:27017/regalia`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    heartbeatFrequencyMS: 5000,
    socketTimeoutMS: 10 * 60 * 1000,
});

module.exports = {
    transactions: require('./model.transaction'),
    users: require('./model.user'),
    payments: mongoose.model("Payment", require('./model.payment'), "payments"),
    collections: mongoose.model("Collection", require('./model.collection'), "collections"),
    nfts: mongoose.model("NFT", require('./model.nft'), "nfts")
};
