'use strict';

require('../spec_helper');
const chai = require('chai');
const client = require('../test_harness').client();
const OrdersCreateRequest = paypal.orders.OrdersCreateRequest;


function buildRequestBody() {
    return {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": "test_ref_id1",
                "amount": {
                    "currency_code": "USD",
                    "value": "100.00"
                }
            }
        ]
    };
}

function createOrder() {
    let request = new OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody(buildRequestBody());
    return client.execute(request);
}
describe('OrdersCreateRequest', function () {
    it('creates an order', function () {
        return createOrder().then((createResponse) => {
            chai.assert.equal(createResponse.statusCode, 201);
            chai.assert.isNotNull(createResponse.result);

            let createdOrder = createResponse.result;
            chai.assert.isNotNull(createdOrder.id);
            chai.assert.isNotNull(createdOrder.purchase_units);
            chai.assert.equal(1, createdOrder.purchase_units.length);

            let firstPurchaseUnit = createdOrder.purchase_units[0];
            chai.assert.equal("test_ref_id1", firstPurchaseUnit.reference_id);
            chai.assert.equal("USD", firstPurchaseUnit.amount.currency_code);
            chai.assert.equal("100.00", firstPurchaseUnit.amount.value);

            chai.assert.isNotNull(createdOrder.create_time);
            chai.assert.isNotNull(createdOrder.links);

            var foundApproveURL = false;
            for (let link of createdOrder.links) {
                if ("approve" === link.rel) {
                    foundApproveURL = true;
                    chai.assert.isNotNull(link.href);
                    chai.assert.equal("GET", link.method);
                }
            }
            chai.assert.isTrue(foundApproveURL);

            chai.assert.equal("CREATED", createdOrder.status);
        });
    });
});

module.exports = {
    CreateOrder: createOrder
};
