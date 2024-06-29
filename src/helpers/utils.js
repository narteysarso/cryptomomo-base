const ethers = require("ethers");
const bcrypt = require('bcrypt');
const getSigner = require("./signer");
const { erc20Abi} = require("viem");

const parseUnits = (amount, unit) => ethers.utils.parseUnits(amount, unit);

const formatUnits = (amount, unit) => ethers.utils.formatUnits(amount, unit);


const checkSumAddress = (address) => ethers.utils.getAddress(address);

/**
 * Generates a number of random signers
 * @param {Number} quantity The number of random signers to generate
 * @returns Object
 */
const generateRandomKeys = (quantity = 1) => {
    const keys = Array(quantity).fill("").map(k => new ethers.Wallet.createRandom());
 
    return Object.freeze({
       privateKeys: keys.map((key) => key._signingKey().privateKey),
       owners: keys.map((key) => key.address),
       signers: keys
    });
 }
 

 const encodeAddress = (rawAddresses) => {
    const encoder = new ethers.utils.AbiCoder();
    
    const addresses = rawAddresses.map( rawAddress => encoder.encode(["address"], [rawAddress]))
 
    return addresses;
 }
 

 const getHash = async(pin) => {
   return await bcrypt.hash(pin, parseInt(process.env.SALT_ROUND));
}

const parsePhoneNumber = (phonenumber) => {
   return parseInt(phonenumber).toString();
}

const getERC20Contract = (tokenAddress) =>{
   const contract = new ethers.Contract(tokenAddress, erc20Abi);

   const signer = getSigner();

   const contractWithSigner = contract.connect(signer);

   return contractWithSigner;
}

const getTokenBalance = async (tokenAddress, address) => {
   
   const tokenContract = getERC20Contract(tokenAddress);

   const [
      balance, 
      decimals
   ] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals()
   ])

   const formattedBalance = formatUnits(balance, decimals);

   return formattedBalance;
}

const getAccountBalance = async(walletAddress) => {

   const provider = getSigner().provider;

   const balance = await provider.getBalance(walletAddress);

   return formatUnits(balance, 18);
}

module.exports = {
    parseUnits,
    formatUnits,
    checkSumAddress,
    generateRandomKeys,
    encodeAddress,
    getHash,
    parsePhoneNumber,
    getERC20Contract,
    getTokenBalance,
    getAccountBalance
}