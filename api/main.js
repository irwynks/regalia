require("dotenv").config({ path: "../.env" });
const moment = require("moment");
const fs = require("fs");
const _ = require("lodash");

const express = require("express");
const parser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 8069;

app.use(parser.json({ limit: '10mb' }));
app.use(parser.urlencoded({ extended: true }));

app.use(cors({
    origin: (origin, cb) => {
        return cb(null, true);
    },
})
);

const router = express.Router();
app.use(router);

require("./routes/route.main")(router);

app.listen(port, () => {
    console.log("Regalia engine API started. Listening on port", port);
});
