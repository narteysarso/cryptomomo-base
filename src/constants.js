const TOKENS = {
    USDT: {address: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832", decimals: 6},
    WMATIC: {address: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", decimals: 18},
    TTK: {address: "0x4A40d5c9986c5D3e3E74f6f787D51a3A1Ebd613A", decimals: 18}
}

const AUTO_YIELD_ABI = {
    "USDT": require("./abis/xUSDT.json"),
    "USDC": require("./abis/xUSDC.json"),
}

const TOKENKEY = ["USDT", "WMATIC", "TTK"];

module.exports = {
    TOKENS,
    TOKENKEY,
    AUTO_YIELD_ABI
}