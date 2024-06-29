const polybase = require("../db/polybase");
const makeAccountLists = require("./account-list");
const makeAccountEndpointHandler = require("./account-endpoint");

const accountList = makeAccountLists({database: polybase});
const accountEndpoint = makeAccountEndpointHandler({accountList});

module.exports = {
    accountEndpoint,
    accountList
};
