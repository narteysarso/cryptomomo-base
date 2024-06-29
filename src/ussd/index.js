const makeMenu = require("./ussd");
const makeWalletList = require("../wallets/wallet-list");
const {accountList} = require("../accounts");
const {webList} = require("../web")

const walletList = makeWalletList();
const ussdMenu = makeMenu({walletList, accountList, webList});

module.exports = {
    ussdMenu
}