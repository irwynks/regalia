module.exports = (router) => {

    router.route('/v1/postback/sale')
        .post((req, res) => {

            let resp, status;
            try {
                console.error(req.body);
                status = 200;
                resp = {
                    success: true,
                    message: 'OK.',
                    data: {}
                }
            } catch (err) {
                console.log(err)
                resp = {
                    success: true,
                    message: err,
                    data: {}
                }
            } finally {
                res.status(status).send(resp)
            }



        })

}