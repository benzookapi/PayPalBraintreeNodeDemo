'use strict';

const paypal = require('../lib/lib').core;

function client() {
  return new paypal.PayPalHttpClient(environment());
}

function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID || '<<PAYPAL-CLIENT-ID>>';
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET || '<<PAYPAL-CLIENT-SECRET>>';

  return new paypal.SandboxEnvironment(
    clientId, clientSecret
  );
}

module.exports = {
    client: client,
    environment: environment
};
