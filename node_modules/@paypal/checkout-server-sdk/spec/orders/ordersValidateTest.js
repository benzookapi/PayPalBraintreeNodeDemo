'use strict';

require('../spec_helper');

const chai = require('chai');
const client = require('../test_harness').client();


describe('OrdersValidateRequest', function () {
  xit('validates a card', function () {
    let request = new paypal.orders.OrdersValidateRequest('ORDER-ID');

    return client.execute(request).then((r) => {
      chai.assert.equal(r.statusCode, 200);
      chai.assert.isNotNull(r.result);
    });
  });
});
