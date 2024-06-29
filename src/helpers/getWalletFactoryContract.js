const getSigner = require("./signer");
const walletAbi = require("../abis/defaultFactory.json");
const ethers = require("ethers");

const gasLimit = process.env.GAS_LIMIT;

const getCoinbaseSmartWalletFactory = () => {

   const contract = new ethers.Contract(walletAbi.address, walletAbi.abi);

   const signer = getSigner();

   const contractWithSigner = contract.connect(signer);

   return contractWithSigner;
}

const createWallet = async ({ownersBytes, nonce }) => {

   const smartWallet = getCoinbaseSmartWalletFactory();

   const txn = await smartWallet.createAccount( ownersBytes, nonce);

   const deployedAddress = await txn.wait();

   return deployedAddress;

}


const getAddressByOwners = async ({ ownersBytes, nonce }) => {
   const smartWallet = getCoinbaseSmartWalletFactory();

   const deployableAddress = await smartWallet.getAddress(ownersBytes, nonce);

   return deployableAddress;

}



module.exports = () => {
   return Object.freeze({
      createWallet,
      getAddressByOwners,
      getCoinbaseSmartWalletFactory,
      address: walletAbi.address,
      abi: walletAbi.abi
   })
}