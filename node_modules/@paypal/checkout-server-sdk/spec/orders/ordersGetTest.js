'use strict';

require('../spec_helper');

const chai = require('chai');
const client = require('../test_harness').client();
const OrdersGetRequest = paypal.orders.OrdersGetRequest;
const CreateOrder = require('./ordersCreateTest').CreateOrder;




describe('OrdersGetRequest', function () {
    it('retrieves an order', function () {
        return CreateOrder().then((createOrderResponse) => {
            chai.assert.equal(createOrderResponse.statusCode, 201);
            let getRequest = new OrdersGetRequest(createOrderResponse.result.id);
            return client.execute(getRequest).then((getResponse) => {
                chai.assert.equal(getResponse.statusCode, 200);
                chai.assert.isNotNull(getResponse.result);

                let createdOrder = getResponse.result;
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
});