const rclient = require('../../utils/redis');
const mdl = require("../../utils/middleware");
const axios = require("axios");
const qs = require("qs");
const db = require("../../utils/models/model.main");
const _ = require("lodash");
const moment = require("moment");
const { PromisePool } = require("@supercharge/promise-pool");

module.exports = (router) => {

    router.route(`/v1/stats/royalties/by-collection`)
        .get(mdl.authUser, async (req, res) => {
            let resp;
            try {

                console.log('Getting royalty data');

                let userId = req.user.id;
                let { start, end } = req.query;

                let user = await db.users.findOne({ _id: userId }).lean();

                let collection = user.collections[0];

                if (!!collection) {

                    let data = {
                        count: 0
                    };

                    start = moment(start || moment().subtract(7, 'd')).startOf('day').unix()
                    end = moment(end || moment()).endOf('day').unix()

                    let sales = await db.transactions.find({
                        firstCreatorAddress: collection.firstCreatorAddress,
                        blocktime: { $gte: start, $lte: end }
                    }).sort({ blocktime: -1 });

                    data.sales = sales;

                    let metrics = {
                        earnings: 0,
                        potentialEarnings: 0,
                        regaliaEarnings: 0,
                        fulfillmentRate: 0,
                        marketplaceBreakdown: {}
                    }

                    await PromisePool.withConcurrency(50)
                        .for(sales)
                        .process(async (item) => {
                            try {
                                data.count += 1;
                                let { royaltyPaid, royaltyAmount, royaltyPaidPercent, effectiveRoyaltyPaidPercent, effectiveRoyaltyPaid, marketplace } = item

                                metrics.earnings += +effectiveRoyaltyPaid;
                                metrics.potentialEarnings += +royaltyAmount;
                                metrics.fulfillmentRate += (+effectiveRoyaltyPaidPercent >= 100 ? 1 : 0);
                                metrics.regaliaEarnings += +effectiveRoyaltyPaid - +royaltyPaid;

                                if (!!!metrics.marketplaceBreakdown[marketplace])
                                    metrics.marketplaceBreakdown[marketplace] = {};

                                metrics.marketplaceBreakdown[marketplace].count = (metrics.marketplaceBreakdown[marketplace].count || 0) + 1
                                metrics.marketplaceBreakdown[marketplace].earnings = (metrics.marketplaceBreakdown[marketplace].earnings || 0) + +effectiveRoyaltyPaid;
                                metrics.marketplaceBreakdown[marketplace].potentialEarnings = (metrics.marketplaceBreakdown[marketplace].potentialEarnings || 0) + +royaltyAmount;
                                metrics.marketplaceBreakdown[marketplace].fulfillmentRate = (metrics.marketplaceBreakdown[marketplace].fulfillmentRate || 0) + (+effectiveRoyaltyPaidPercent >= 100 ? 1 : 0);
                            } catch (err) {
                                console.log(err);
                            }
                        })

                    metrics.fulfillmentRate = metrics.fulfillmentRate / data.count


                    for (let mkt of Object.keys(metrics.marketplaceBreakdown)) {
                        metrics.marketplaceBreakdown[mkt].fulfillmentRate = metrics.marketplaceBreakdown[mkt].fulfillmentRate / metrics.marketplaceBreakdown[mkt].count
                    }

                    data.metrics = metrics;

                    resp = {
                        success: true,
                        message: 'Collection stats retrieved.',
                        data
                    }

                } else {

                    resp = {
                        success: true,
                        message: 'Collection stats retrieved.',
                        data: {}
                    }

                }



            } catch (err) {
                console.log(err)
                resp = {
                    success: false,
                    message: err,
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })

    router.route(`/v1/stats/community/by-user`)
        .get(mdl.authUser, async (req, res) => {
            let resp;
            try {

                console.log('Getting community data');

                let userId = req.user.id;
                let { start, end } = req.query;



                let user = await db.users.findOne({ _id: userId }).lean();

                let collection = user.collections[0];

                if (!!collection) {

                    let { firstCreatorAddress } = collection

                    start = moment(start || moment().subtract(7, 'd')).startOf('day').unix()
                    end = moment(end || moment()).endOf('day').unix()

                    let sales = await db.transactions.aggregate([
                        { $match: { firstCreatorAddress, blocktime: { $gte: start + "", $lte: end + "" } } },
                        { $group: { _id: "$buyer", nfts: { $push: '$mintAddress' }, purchases: { $push: "$$ROOT" } } },
                    ])

                    let withRoyaltiesPaid = {
                    }

                    resp = {
                        success: true,
                        message: 'Collection stats retrieved.',
                        data: sales
                    }

                } else {

                    resp = {
                        success: true,
                        message: 'Collection stats retrieved.',
                        data: {}
                    }

                }


            } catch (err) {
                console.log(err)
                resp = {
                    success: false,
                    message: err,
                    data: {}
                }
            } finally {
                res.status(200).send(resp)
            }

        })
}