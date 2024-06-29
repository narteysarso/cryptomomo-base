const { erc20Abi } = require("viem");
const { TOKENS } = require("../constants");
const { abi: smWAbi } = require("../abis/coinbaseSmartWallet.json");
const { InvalidPropertyError } = require("../helpers/errors");
const getWalletFactoryContract = require("../helpers/getWalletFactoryContract");
const isValidPhonenumber = require("../helpers/is-valid-phonenumber");
const { parseUnits, checkSumAddress } = require("../helpers/utils");
const { getSmartContractClient, createTransactionData, sendTransaction } = require("../paymaster");
const { privateKeyToSimpleSmartAccount } = require("permissionless/accounts");
const paymaster = require("../paymaster");

function makeWalletList() {

    const createWallet = async ({
        phonenumber,
        ownersBytes
    }) => {
        const walletContract = getWalletFactoryContract();

        if (!isValidPhonenumber(phonenumber)) throw new InvalidPropertyError(
            `Invalid phonenumber`
        );

        const result = await walletContract.createWallet({ ownersBytes, nonce: phonenumber });

        return result;
        // TODO: prepare blockchain response
    }

    const getWalletAddress = async ({
        phonenumber,
        ownersBytes
    }) => {
        if (!isValidPhonenumber(phonenumber)) throw new InvalidPropertyError(
            `Invalid phonenumber`
        );

        const walletContract = getWalletFactoryContract();


        const address = await walletContract.getAddressByOwners({ ownersBytes, nonce: phonenumber });


        return address;
    }

    const transferTokensToAccount = async ({
        privateKey,
        fromWalletAddress,
        fromPhonenumber,
        toWalletAddress,
        tokenAddress,
        amount = 0
    }) => {
        if (!amount) throw new InvalidPropertyError(
            `Amount must be greater than zero (0)`
        );

        if (!privateKey) throw new InvalidPropertyError(
            `Private key is required`
        );

        if (!checkSumAddress(fromWalletAddress)) throw new InvalidPropertyError(
            `Address Error: ${fromWalletAddress} is invalid`
        )

        if (!checkSumAddress(toWalletAddress)) throw new InvalidPropertyError(
            `Address Error: ${toWalletAddress} is invalid`
        )

        if (!checkSumAddress(tokenAddress)) throw new InvalidPropertyError(
            `Address Error: ${tokenAddress} is invalid`
        )

        const smartAccountClient = await getSmartContractClient({ privateKey, walletAddress: fromWalletAddress, phonenumber: fromPhonenumber });

        const txnData = createTransactionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [toWalletAddress, amount]
        });

        const result = await sendTransaction({
            smartAccountClient,
            from: fromWalletAddress,
            toContractAdress: tokenAddress ,
            callData: txnData,
            value: 0n
        })

        return result;

    }

    const transferTokensToAddress = async ({
        fromPhonenumber,
        toAddress,
        token,
        amount = 0
    }) => {
        if (!amount) throw new InvalidPropertyError(
            `Amount must be greater than zero (0)`
        );;

        if (!isValidPhonenumber(fromPhonenumber)) throw new InvalidPropertyError(
            `Invalid from phonenumber`
        );

        if (!TOKENS[token]) throw new InvalidPropertyError(
            `Token is not support`
        );

        // TODO: prepare coinbase smart wallet txn

    }


    const balanceOf = async ({
        phonenumber,
        tokenAddress
    }) => {
        
        if (!isValidPhonenumber(phonenumber)) throw new InvalidPropertyError(
            `Invalid phonenumber`
        );




        return // TODO: Get token balance on associated smart wallet
    }

  
    return Object.freeze({
        createWallet,
        transferTokensToAddress,
        transferTokensToAccount,
        getWalletAddress,
        balanceOf,
       
    })
}

module.exports = makeWalletList;