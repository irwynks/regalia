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
    users: require('./model.user')
};
