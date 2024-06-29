const express = require("express");
const bodyParser = require("body-parser");
const adaptRequest = require("./helpers/adapt-http-request");
const {accountEndpoint: handleAccountRequest} = require("./accounts");
const {webEndpoints: handleWebRequest} = require("./web");
const adaptUssdRequest = require("./helpers/adapt-ussd-request");

const { ussdMenu } = require("./ussd");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.all("/ussd", ussdController)
app.all("/accounts", accountController);
app.get("/accounts/:id", accountController);
app.get("/accounts/phonenumber/:phonenumber", accountController);
app.all("/web", webController)
app.post("/web/tokens/transfer", webController)
app.get("/web/phonenumber/:phonenumber", webController);
app.get("/web/accountId/:id", webController);
app.get("/web/balance/:balanceof/:tokenAddress?", webController);

function webController(req, res) {
    const httpRequest = adaptRequest(req);
    handleWebRequest(httpRequest)
        .then(({ headers, statusCode, data }) =>
            res
                .set(headers)
                .status(statusCode)
                .send(data)

        )
        .catch(e => { console.log(e); res.status(500).end() });
}

function accountController(req, res) {
    const httpRequest = adaptRequest(req);
    handleAccountRequest(httpRequest)
        .then(({ headers, statusCode, data }) =>
            res
                .set(headers)
                .status(statusCode)
                .send(data)

        )
        .catch(e => { console.log(e); res.status(500).end() });
}

function ussdController(req, res) {
    const ussdRequest = adaptUssdRequest(req);
    try {

        ussdMenu.run(ussdRequest).then(resMsg => {
            res
                .set({ "content-type": "text/plain" })
                .send(resMsg)
        }).catch(e => { console.log(e); res.status(500).end() });
        
    } catch (error) {
        console.log(error);
    }
}


app.listen(9000, () => console.log('server listening at port 9000'))

