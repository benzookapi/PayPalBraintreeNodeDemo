'use strict';

require('../spec_helper');

const chai = require('chai');
const client = require('../test_harness').client();
const OrdersGetRequest = paypal.orders.OrdersGetRequest;
const CreateOrder = require('./ordersCreateTest').CreateOrder;
const OrdersPatchRequest = paypal.orders.OrdersPatchRequest;


function buildRequestBody() {
  return [
      {
          "op": "add",
          "path": "/purchase_units/@reference_id=='test_ref_id1'/description",
          "value": "added_description"
      },
      {
          "op": "replace",
          "path": "/purchase_units/@reference_id=='test_ref_id1'/amount",
          "value": {
              "currency_code": "USD",
              "value": "200.00"
          }

      }
  ];
}

describe('OrdersPatchRequest', function () {
  it('works as expected', function () {
      return CreateOrder().then((createOrderResponse) => {
          chai.assert.equal(createOrderResponse.statusCode, 201);
          let patchRequest = new OrdersPatchRequest(createOrderResponse.result.id);
          patchRequest.requestBody(buildRequestBody());
          return client.execute(patchRequest).then((patchResponse) =>
          {
              chai.assert.equal(patchResponse.statusCode, 204);
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
                  chai.assert.equal("200.00", firstPurchaseUnit.amount.value);
                  chai.assert.equal("added_description", firstPurchaseUnit.description);

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
});
