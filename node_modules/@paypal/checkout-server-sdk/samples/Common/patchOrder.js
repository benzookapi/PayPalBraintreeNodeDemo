'use strict';

const client = require('./payPalClient').client;
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const createOrder = require('../AuthorizeIntentExamples/createOrder').createOrder;
const getOrder = require('./getOrder').getOrder;

function buildRequestBody(){
    return [
        {
            "op": "replace",
            "path": "/intent",
            "value": "CAPTURE"
        },
        {
            "op": "replace",
            "path": "/purchase_units/@reference_id=='PUHF'/amount",
            "value": {
                "currency_code": "USD",
                "value": "200.00",
                "breakdown": {
                    "item_total": {
                        "currency_code": "USD",
                        "value": "180.00"
                    },
                    "tax_total": {
                        "currency_code": "USD",
                        "value": "20.00"
                    }
                }
            }
        }
    ];
}

async function patchOrder(orderId) {
    let request = new checkoutNodeJssdk.orders.OrdersPatchRequest(orderId);
    request.requestBody(buildRequestBody());
    let response = await client().execute(request);
    console.log("PATCH Status Code: " + response.statusCode);
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
}

if (require.main === module){
    (async() => {
        console.log("Before PATCH:");
        let response = await createOrder(true);
        console.log("\nAfter PATCH (Changed Intent and Amount):");
        await patchOrder(response.result.id);
        await getOrder(response.result.id);
    })();
}