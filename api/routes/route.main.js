module.exports = (router) => {
    require('./route.actions')(router)
    require('./route.users')(router)
    require('./route.stats')(router)
}