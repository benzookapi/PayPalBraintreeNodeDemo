'use strict';

/**
 * PayPal Node JS dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('./payPalClient');

/**
 * This method can be used to refund the capture. This function should be called
 * with valid captureId in the argument.
 * 
 * @param captureId
 * @param debug
 * @returns
 */
async function refundOrder(captureId, debug=false) {
    try {
        const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(captureId);
        request.requestBody({
                "amount": {
                  "value": "20.00",
                  "currency_code": "USD"
                }
        });
        const response = await payPalClient.client().execute(request);
        if (debug){
            console.log("Status Code: " + response.statusCode);
            console.log("Status: " + response.result.status);
            console.log("Refund ID: " + response.result.id);
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
 * This is the driver function which invokes the refundCapture function with
 * Capture Id to refund the capture.
 * 
 * Capture Id should be replaced with an valid one.
 */
if (require.main === module){
    // Replace capture id from captureOrder here to see it work
    (async() => await refundOrder('<<REPLACE-WITH-VALID-CAPTURE-ID>>', true))();
}

/**
 * Exports the refundOrder function. If needed this can be invoked from the
 * order modules to execute the end to flow like create order, retrieve, capture
 * and refund(Optional)
 */
module.exports = {refundOrder:refundOrder};