class WS {
    constructor(data, res) {
        if (typeof data === "string") data = JSON.parse(data);
        this.data = {};
        Object.assign(this.data, data);
        this.res = res;
    };
}

module.exports = WS;