const rclient = require("./redis");

module.exports = {

    authAPI: async (req, res, next) => {
        try {
            console.log('Authenticating..');
        } catch (err) {
            console.log(err);
        } finally {
            next()
        }
    },

    authUser: async (req, res, next) => {
        try {
            req.user = {};
            console.log('Authenticating user..');
            let session_id = req.get('Authorization');

            let userId = await rclient.hget('maps.sessionToUser', session_id);

            if (!!userId) {
                req.user.id = userId;
            } else {
                return res.status(200).send({
                    success: false,
                    message: 'Invalid session.',
                    data: {}
                })
            }

        } catch (err) {
            console.log(err);
        } finally {
            next()
        }
    }

}