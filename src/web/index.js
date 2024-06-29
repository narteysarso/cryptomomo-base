const makeWalletList = require("../wallets/wallet-list");
const makeWebLists = require("../web/web-list");
const makeWebEndpoints = require("./web-endpoint");
const {accountList} = require("../accounts");


const walletList = makeWalletList();
const webList = makeWebLists({walletList, accountList });
const webEndpoints = makeWebEndpoints({webList});

module.exports = {
    webEndpoints,
    webList
}