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
 * This function can be used to perform authorization on the approved order. 
 * An valid approved order id should be passed as an argument to this function. 
 * 
 * @param orderId
 * @param debug
 * @returns
 */
async function authorizeOrder(orderId, debug=false) {
    try {
        const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderId);
        request.requestBody({});
        const response = await payPalClient.client().execute(request);
        if (debug){
            console.log("Status Code: " + response.statusCode);
            console.log("Status: " + response.result.status);
            console.log('Authorization ID: ', response.result.purchase_units[0].payments.authorizations[0].id);
            console.log("Order ID: " + response.result.id);
            console.log("Links: ");
            response.result.links.forEach((item, index) => {
                let rel = item.rel;
                let href = item.href;
                let method = item.method;
                let message = `\t${rel}: ${href}\tCall Type: ${method}`;
                console.log(message);
            });
            console.log("Authorization Links:");
            response.result.purchase_units[0].payments.authorizations[0].links.forEach((item, index) => {
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
 * This is the driver function which invokes the authorizeOrder function with approved Order Id
 * to retrieve an order details.
 * 
 * Order Id should be replaced with an valid approved order Id.
 */
if (require.main === module){
    // Replace order id (after approval) here to see it work
    (async() => await authorizeOrder('<<REPLACE-WITH-APPROVED-OREDER-ID>>', true))();
}

/**
 * Exports the authorize Order function. If needed this can be invoked from the order
 * modules to execute the end to flow like create order, retrieve, authorize, capture and
 * refund(Optional)
 */
module.exports = {authorizeOrder:authorizeOrder};