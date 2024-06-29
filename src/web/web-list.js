const crypto = require("crypto");
const bcrypt = require('bcrypt');
require("dotenv").config({ path: ".env.local" });

const getSigner = require('../helpers/signer');
const { generateRandomKeys, encodeAddress, getHash, getERC20Contract, getTokenBalance, getAccountBalance } = require("../helpers/utils");
const { symmmetricEncryptString, symmetricDecryptString } = require("../helpers/encrypt");
const { AlreadyInUseError, InvalidPropertyError } = require("../helpers/errors");
const { bytesToBase64 } = require("../helpers/base64");
const makeAccount = require("../accounts/account");
const { BigNumber } = require("ethers");

function makeWebLists({ walletList, accountList }) {

    const signer = getSigner();

    return Object.freeze({
        createWallet,
        getWalletByPhonenumber,
        getWalletByAccountId,
        getAllWallets,
        authenticate,
        removeWalletByPhonenumber,
        removeWalletById,
        updateWalletInfo,
        getWalletBalanceByPhonenumber,
        retrievePinKey,
        transferToken
    });


    async function createWallet(accountInfo) {
        const { firstname, lastname, pin, phonenumber } = makeAccount(accountInfo);
        const existPhonenumber = await accountList.findByPhonenumber({ phonenumber: phonenumber });

        if (existPhonenumber?.phonenumber) {
            throw new AlreadyInUseError(phonenumber);
        }

        const { privateKeys, owners } = generateRandomKeys(1);

        const [pinkey] = await Promise.all(privateKeys.map((k) => symmmetricEncryptString(pin, k)));

        // const ownersBytes = encodeAddress(owners);


        const walletAddress = await walletList.getWalletAddress({ ownersBytes: owners[0], phonenumber });

        const walletRes = await walletList.createWallet({ ownersBytes: owners[0], phonenumber });

        const dbRes = await accountList.add({
            pinHash: await getHash(pin),
            firstname,
            lastname,
            phonenumber,
            evmAddress: walletAddress,
            owners,
            pinkeyversion: pinkey.version,
            pinkeynonce: bytesToBase64(pinkey.nonce),
            pinkeyciphertext: bytesToBase64(pinkey.ciphertext),
        });

        return {
            walletAddress,
            firstname,
            lastname,
            phonenumber,
            transactionHash: walletRes?.transactionHash
        }
    }

    async function getWalletByPhonenumber(_phonenumber) {

        const wallet = await accountList.findByPhonenumber({ phonenumber: _phonenumber });

        if (!wallet) throw new InvalidPropertyError(`Phone number: ${_phonenumber} is not found`);

        const { evmAddress, firstname, lastname, createdAt, updatedAt, id, owners, phonenumber } = wallet;

        return Object.freeze({
            evmAddress,
            firstname,
            lastname,
            createdAt,
            updatedAt,
            id,
            owners,
            phonenumber
        });
    }

    async function getWalletBalanceByPhonenumber(_phonenumber, tokenAddress = "") {

        const { evmAddress } = await getWalletByPhonenumber(_phonenumber);

        if (!evmAddress) throw new InvalidPropertyError(`Account ${_phonenumber} has invalid address: ${evmAddress}`)

        const balance = tokenAddress ? await getTokenBalance(tokenAddress, evmAddress) : await getAccountBalance(evmAddress);

        return {
            balance
        }

    }

    async function transferToken({ tokenAddress, fromPhonenumber, toPhonenumber, amount, pin }) {

        const [{ evmAddress: fromWalletAddress }, { evmAddress: toWalletAddress }] = await Promise.all(
            [
                getWalletByPhonenumber(fromPhonenumber),
                getWalletByPhonenumber(toPhonenumber)
            ]
        )

        const {privateKey} = await retrievePinKey({phonenumber: fromPhonenumber, pin});

        if(!privateKey) throw new InvalidPropertyError(`Private key not retreivable`);

        const result = await walletList.transferTokensToAccount({
            privateKey,
            fromWalletAddress, 
            toWalletAddress,
            tokenAddress,
            fromPhonenumber,
            amount: BigNumber.from(amount)
        });

        return result;
    }

    async function getWalletByAccountId(accountId) {

        const wallet = await accountList.findById({ accountId });

        if (!wallet) throw new InvalidPropertyError(`Account Id: ${accountId} is not found`);

        const { evmAddress, firstname, lastname, createdAt, updatedAt, id, owners, phonenumber } = wallet;

        return Object.freeze({
            evmAddress,
            firstname,
            lastname,
            createdAt,
            updatedAt,
            id,
            owners,
            phonenumber
        });
    }

    async function getAllWallets({ offset, limit }) {
        const response = await accountList.findAll({ offset, limit });



        const result = response?.map((res) => {
            const { evmAddress,
                firstname,
                lastname,
                createdAt,
                updatedAt,
                id,
                owners,
                phonenumber } = res;

            return {
                evmAddress,
                firstname,
                lastname,
                createdAt,
                updatedAt,
                id,
                owners,
                phonenumber
            }
        })

        return result;
    }

    async function removeWalletByPhonenumber(phonenumber) {
        const account = await getWalletByPhonenumber(phonenumber);

        if (!account) throw Error("Account not found");

        const result = await accountList.remove({ accountId: account.id });

        return result;
    }

    async function removeWalletById(accountId) {
        const account = await getWalletByAccountId(accountId);

        if (!account) throw Error("Account not found");

        const result = await accountList.remove({ accountId });

        return result;
    }

    async function authenticate({ phonenumber, pin }) {
        const account = await accountList.findByPhonenumber({ phonenumber });

        if (!account) throw Error("Account not found");

        const validity = await bcrypt.compare(pin, account?.pin);

        return {
            isValid: validity
        }
    }

    async function retrievePinKey({ phonenumber, pin }) {

        const {isValid} = await authenticate({phonenumber, pin});

        if(!isValid ) throw new Error("Invalid credentials");

        const account = await accountList.findByPhonenumber({ phonenumber });

        const decryptedPinKey = await symmetricDecryptString(pin, account.pinkey);

        return {
            privateKey: decryptedPinKey
        }
    }

    async function updateWalletInfo({ accountId, ...accountInfo }) {

        const result = await accountList.update(accountId, accountInfo);

        return result;
    }

}

module.exports = makeWebLists