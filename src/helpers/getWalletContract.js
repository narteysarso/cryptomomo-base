const ethers = require("ethers");
const { getAddressByOwners } = require('./getWalletFactoryContract');
const walletAbi = require("../abis/coinbaseSmartWallet.json");

export default function () {

    const parseUnits = (amount, unit) => ethers.utils.parseUnits(amount, unit);

    const formatUnits = (amount, unit) => ethers.utils.formatUnits(amount, unit);

    const getWalletByAddress = (address) => {
        const contract = new ethers.Contract(address, walletAbi.abi);

        const signer = getSigner();

        const contractWithSigner = contract.connect(signer);

        return contractWithSigner;
    }


    const getWalletByOwners = async ({ owners, nonce }) => {
        const address = await getAddressByOwners({ owners, nonce });
        return address;
    }


    const execute = async({ target, walletAddress, value, amount, r, v, s }) => {
        if(!checkSumAddress(target)) throw Error("Invalid target address");
        if(!checkSumAddress(walletAddress)) throw Error("Invalid wallet address");
        const smartWallet = getWalletByAddress(walletAddress);
        const txnData = generateTransactionData({target, amount});
        const txn = await smartWallet.execute(target, value, txnData);
        const result = await txn.wait();

        return result;
    }

    const generateTransactionData = ({ toAddress, amount }) => {

        const erc20Interface = new ethers.utils.Interface(ERC20.abi);

        const data = erc20Interface.encodeFunctionData("transfer", [toAddress, amount.toString()]);

        return data;
    }




    return Object.freeze({
        getWalletByAddress,
        getWalletByOwners,
        execute
    })
}