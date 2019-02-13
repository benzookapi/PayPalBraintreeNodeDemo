'use strict';

require('../spec_helper');

const chai = require('chai');
const client = require('../test_harness').client();


describe('OrdersAuthorizeRequest', function () {
  xit('authorizes an order', function () {
    // This test is an example, in production, orders will require payer approval
    let request = new paypal.orders.OrdersAuthorizeRequest('ORDER-ID');

    return client.execute(request).then((r) => {
      chai.assert.equal(r.statusCode, 201);
      chai.assert.isNotNull(r.result);
    });
  });
});
