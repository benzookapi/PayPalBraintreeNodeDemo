'use strict';

/**
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('../Common/payPalClient');

/**
 * This function can be used to capture the payment on an authorized Order.
 * An Valid authorization Id should be passed as an argument to this method.
 * 
 * @param authId
 * @param debug
 * @returns
 */
async function captureOrder(authId, debug=false) {
    try {
        const request = new checkoutNodeJssdk.payments.AuthorizationsCaptureRequest(authId);
        request.requestBody({});
        const response = await payPalClient.client().execute(request);
        if (debug){
            console.log("Status Code: " + response.statusCode);
            console.log("Status: " + response.result.status);
            console.log("Capture ID: " + response.result.id);
            console.log("Links:");
            response.result.links.forEach((item, index) => {
                let rel = item.rel;
                let href = item.href;
                let method = item.method;
                let message = `\t${rel}: ${href}\tCall Type: ${method}`;
                console.log(message);
            });
            // To toggle print the whole body comment/uncomment the below line
            console.log(JSON.stringify(response.result, null, 4));
        }
        return response;
    }
    catch (e) {
        console.log(e)
    }
}

/**
 * This is the driver function which invokes the captureOrder function with authorization Id
 * to retrieve an order details.
 * 
 * Authorization id should be replaced with an valid authorization Id.
 */
if (require.main === module){
    // Replace authorization id from authorizeOrder here to see it work
    (async() => await captureOrder('<<REPLACE-WITH-VALID-AUTHORIZATION-ID>>', true))();
}

/**
 * Exports the capture Order function. If needed this can be invoked from the order
 * modules to execute the end to flow like create order, retrieve, authorize, capture and
 * refund(Optional)
 */
module.exports = {captureOrder:captureOrder};