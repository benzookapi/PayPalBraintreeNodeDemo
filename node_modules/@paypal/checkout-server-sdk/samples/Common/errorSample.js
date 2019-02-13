const client = require('./payPalClient').client;
const authToken = require('./payPalClient').authentication;
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const prettyPrint = require('./payPalClient').prettyPrint;
/**
 * Body has no required parameters (intent, purchase_units)
 */
async function createError1(){
    try {
        const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({});
        console.log(`Request Body:\n${JSON.stringify(request.body, null, 4)}`);
        console.log("Response:");
        const response = await client().execute(request);
    }
    catch (e) {
        let message = JSON.parse(e.message);
        console.log(await prettyPrint(message));
    }
}

/**
 * Body has invalid parameter value for intent
 */
async function createError2(){
    try {
        const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({"intent": "INVALID","purchase_units": [{"amount": {"currency_code": "USD","value": "100.00"}}]});
        console.log(`Request Body:\n${JSON.stringify(request.body, null, 4)}`);
        console.log("Response:");
        const response = await client().execute(request);
    }
    catch (e) {
        let message = JSON.parse(e.message);
        console.log("Status Code:" , e.statusCode);
        console.log(await prettyPrint(message));
    }
}

(async() => {
    console.log("Calling createError1 (Body has no required parameters (intent, purchase_units))");
    await createError1();
    console.log("\nExecuting createError2 (Body has invalid parameter value for intent)");
    await createError2();
})();