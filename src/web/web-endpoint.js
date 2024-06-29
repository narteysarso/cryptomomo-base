const { InvalidPropertyError, RequiredParameterError, UniqueContantError } = require("../helpers/errors");
const makeAccount = require("../accounts/account");
const makeHttpError = require("../helpers/http-error");

function makeAccountEndpointHandler({ webList }) {
    return async function handle(httpRequest) {
        switch (httpRequest.method) {
            case 'POST':
                return postRequestHandler(httpRequest);

            case 'GET':
                return getRequestHandler(httpRequest);

            default:
                return makeHttpError({
                    statusCode: 405,
                    errorMessage: `${httpRequest.method} method not allowed.`
                })
        }
    }

    async function getRequestHandler(httpRequest) {
        const { id, phonenumber, balanceof, tokenAddress} = httpRequest.pathParams || {};
        const { offset, limit } = httpRequest.queryParams || {};
        try {

            const result = id ? 
                await webList.getWalletByAccountId(id) : 
                phonenumber ? await webList.getWalletByPhonenumber(phonenumber) : 
                balanceof ? await webList.getWalletBalanceByPhonenumber(balanceof, tokenAddress) : 
                await webList.getAllWallets({ offset, limit });

            return {
                headers: {
                    "Content-Type": "application/json"
                },
                statusCode: 200,
                data: JSON.stringify(result)
            }

        } catch (error) {
            return makeHttpError({
                errorMessage: error.message,
                statusCode:
                    error instanceof UniqueContantError ?
                        409 : error instanceof InvalidPropertyError || error instanceof RequiredParameterError
                            ? 400 : 500
            })
        }

       
    }

    async function postRequestHandler(httpRequest){
        let accountInfo = httpRequest.body;
        if (!accountInfo) return makeHttpError({
            statusCode: 400,
            errorMessage: "Bad request. No POST body"
        })

        if (typeof httpRequest.body === 'string') {
            try {
                accountInfo = JSON.parse(accountInfo);
            } catch (error) {
                return makeHttpError({
                    statusCode: 400,
                    errorMessage: "Bad request. POST body must be valid JSON"
                })
            }
        }
        try {

            const result = (accountInfo.pin && accountInfo.fromPhonenumber && accountInfo.toPhonenumber && accountInfo.tokenAddress && accountInfo.amount) ? await webList.transferToken(accountInfo) : (accountInfo.pin && accountInfo.phonenumber && Object.keys(accountInfo).length === 2)
            ? await webList.authenticate(accountInfo) : await webList.createWallet(accountInfo); 

            return {
                headers: {
                    "Content-Type": "application/json"
                },
                statusCode: 201,
                data: JSON.stringify(result)
            }
        } catch (error) {
            return makeHttpError({
                errorMessage: error.message,
                statusCode:
                    error instanceof UniqueContantError ?
                        409 : error instanceof InvalidPropertyError || error instanceof RequiredParameterError
                            ? 400 : 500
            })
        }
     
    }

}


module.exports = makeAccountEndpointHandler