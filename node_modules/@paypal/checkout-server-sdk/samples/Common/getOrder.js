'use strict';

/**
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('./payPalClient');

/**
 * This dependency is used to create an order.
 */
const createOrder = require('../CaptureIntentExamples/createOrder').createOrder;

/**
 * This function can be used to retrieve an order by passing order Id as
 * argument.
 * 
 * @param orderId
 * @returns
 */
async function getOrder(orderId) {
    let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);
    let response = await payPalClient.client().execute(request);
    console.log("Status Code: " + response.statusCode);
    console.log("Status: " + response.result.status);
    console.log("Order ID: " + response.result.id);
    console.log("Intent: " + response.result.intent);
    console.log("Links: ");
    response.result.links.forEach((item, index) => {
        let rel = item.rel;
        let href = item.href;
        let method = item.method;
        let message = `\t${rel}: ${href}\tCall Type: ${method}`;
        console.log(message);
    });
    console.log(`Gross Amount: ${response.result.purchase_units[0].amount.currency_code} ${response.result.purchase_units[0].amount.value}`);
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
}

/**
 * This is the driver function which invokes the getOrder function with Order Id
 * to retrieve an order details.
 * 
 * To get the correct Order id, we are using the createOrder to create new order
 * and then we are using the newly created order id.
 */
if (require.main === module){

    (async() => {
        let response = await createOrder();
        await getOrder(response.result.id);
    })();
}

/**
 * Exports the getOrder function. If needed this can be invoked from the order
 * modules to execute the end to flow like create order, retrieve, capture and
 * refund(Optional)
 */
module.exports = {getOrder:getOrder};