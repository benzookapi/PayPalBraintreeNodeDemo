'use strict';

/**
 * PayPal Node JS dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('../Common/payPalClient');

/**
 * This function can be used to capture an order payment by passing the approved
 * order id as argument.
 * 
 * @param orderId
 * @param debug
 * @returns
 */
async function captureOrder(orderId, debug=false) {
    try {
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const response = await payPalClient.client().execute(request);
        if (debug){
            console.log("Status Code: " + response.statusCode);
            console.log("Status: " + response.result.status);
            console.log("Order ID: " + response.result.id);
            console.log("Links: ");
            response.result.links.forEach((item, index) => {
                let rel = item.rel;
                let href = item.href;
                let method = item.method;
                let message = `\t${rel}: ${href}\tCall Type: ${method}`;
                console.log(message);
            });
            console.log("Capture Ids:");
            response.result.purchase_units.forEach((item,index)=>{
            	item.payments.captures.forEach((item, index)=>{
            		console.log("\t"+item.id);
                });
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
 * This is the driver function which invokes the captureOrder function with
 * <b>Approved</b> Order Id to capture the order payment.
 */
if (require.main === module){
    (async() =>{
    	await captureOrder("4B0527368W716044K", true)
    	})();
}

/**
 * Exporting the capture order function for external use.
 */
module.exports = {captureOrder:captureOrder};