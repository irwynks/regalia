const rclient = require('../../utils/redis');
const mdl = require("../../utils/middleware");

module.exports = (router) => {

    router.route(`/v1/actions/scrape/by_first_creator`)
        .post(mdl.authAPI, async (req, res) => {
            let resp;
            try {

                let { addresses, force } = req.body;
                let data = {};

                for (let fca of addresses) {
                    let status = await rclient.hget('collections.status', fca)
                    if (!!force && !/scraping/ig.test(status)) {
                        let slug = {
                            action: 'scrape',
                            data: { address: fca }
                        }
                        await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        data[fca] = 'Scraping (Forced)';
                    } else if (!!!status) {
                        let slug = {
                            action: 'scrape',
                            data: { address: fca }
                        }
                        await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        data[fca] = 'Scraping';
                    } else {
                        data[fca] = status;
                    }
                };

                resp = {
                    success: true,
                    message: 'Actions started.',
                    data
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

    router.route(`/v1/actions/scrape/by_user_wallet`)
        .post(mdl.authAPI, async (req, res) => {
            let resp;
            try {

                let { wallet } = req.body;
                let data = {};

                for (let fca of addresses) {
                    let status = await rclient.hget('collections.status', fca)
                    if (!!force && !/scraping/ig.test(status)) {
                        let slug = {
                            action: 'scrape',
                            data: { address: fca }
                        }
                        await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        data[fca] = 'Scraping (Forced)';
                    } else if (!!!status) {
                        let slug = {
                            action: 'scrape',
                            data: { address: fca }
                        }
                        await rclient.lpush('ingest.queue', JSON.stringify(slug));
                        data[fca] = 'Scraping';
                    } else {
                        data[fca] = status;
                    }
                };

                resp = {
                    success: true,
                    message: 'Actions started.',
                    data
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