const { http, createPublicClient, encodeFunctionData } = require("viem");
const { baseSepolia } = require("viem/chains");
const {
    createSmartAccountClient,
    ENTRYPOINT_ADDRESS_V06,
} = require("permissionless");
const { privateKeyToSimpleSmartAccount, signerToSafeSmartAccount, signerToSimpleSmartAccount } = require("permissionless/accounts");
const { createPimlicoPaymasterClient } = require("permissionless/clients/pimlico");
const { privateKeyToAccount } = require("viem/accounts");
require("dotenv").config({ path: ".env.local" });


function makePaymaster() {

    const rpcUrl = process.env.PROVIDER_URL;
    const factoryAddress = process.env.SMW_FACTORY_ADDRESS;

    const publicClient = createPublicClient({
        transport: http(rpcUrl),
    });

    const cloudPaymaster = createPimlicoPaymasterClient({
        chain: baseSepolia,
        transport: http(rpcUrl),
        entryPoint: ENTRYPOINT_ADDRESS_V06,
    });


    async function getSmartContractClient({ privateKey, walletAddress, phonenumber }) {

        const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
            signer: privateKeyToAccount(privateKey),
            // factoryAddress,
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            address: walletAddress
        })
        

        const smartAccountClient = createSmartAccountClient({
            account: simpleAccount,
            chain: baseSepolia,
            bundlerTransport: http(rpcUrl),
            // IMPORTANT: Set up Cloud Paymaster to sponsor your transaction
            middleware: {
                sponsorUserOperation: cloudPaymaster.sponsorUserOperation,
            },
        });

        return smartAccountClient;

    }

    function createTransactionData({ abi, functionName, args }) {
        const callData = encodeFunctionData({
            abi,
            functionName,
            args
        });

        return callData;
    }

    async function sendTransaction({ smartAccountClient, toContractAdress, callData, value = 0n }) {
        
        const txHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account,
            to: toContractAdress,
            data: callData,
            value,
        });

        return txHash;
    }

    return Object.freeze({
        getSmartContractClient,
        createTransactionData,
        sendTransaction
    })
}


module.exports = makePaymaster();
