require("dotenv").config({ path: "../.env" });

const redis = require("ioredis");
const rclient = redis.createClient({
    host: "127.0.0.1",
    port: 6379,
});

rclient.on("error", async function (err) {
    console.log(err);
});

module.exports = rclient;
