// This class was generated on Tue, 24 Jul 2018 10:52:09 PDT by version 0.1.0-dev+0ee05a-dirty of Braintree SDK Generator
// authorizationsVoidRequest.js
// @version 0.1.0-dev+0ee05a-dirty
// @type request
// @data H4sIAAAAAAAC/2yS0YpTMRCG732KYa5jz7J4lTvZKruI7tGWBZFFpifTPdE0iZPJYix9dzltFVt7++XPMP/HbPEDbRgtUtUxif9F6lMss+fkHRqccxnE54mhxYfkXTGQBAaKA4digCL8+ckOMrUNRzWwanA3n8HnVKdoTArTwMtp0JEURiqwYo6wriE0GChrFXYzNPixsrSehDasLAXtl0eDt0yO5Zy+TbI5Zz3peMK2uGx56lxUfHxCgw8knlaBL7n4uhfxjtvx8T8ry5Ghp9ZTePnEkYWUHdzNYZ0EdOSLjdPex1TutQi1wz5XBj8xufsYGto1hcIT+FG9sEOrUtlgLymzqOeCNtYQdo+HDBc9DJnghEpOsfC/7CZF5XiMIeUc/LBv2H0rKaLBW9X8nnVMDi3294slHuShxe75ujsuX7rTU+m257p23fF6Ft99/tvkzc/Mg7JbKGktN8kx2uurV7sXvwEAAP//
// DO NOT EDIT
'use strict';

const querystring = require('querystring'); // eslint-disable-line no-unused-vars
/**
 Voids, or cancels, an authorized payment, by ID. You cannot void an authorized payment that has been fully captured.
 **/

class AuthorizationsVoidRequest {

  constructor(authorizationId) {
    this.path = '/v2/payments/authorizations/{authorization_id}/void?';
    this.path = this.path.replace('{authorization_id}', querystring.escape(authorizationId));
    this.verb = 'POST';
    this.body = null;
    this.headers = {
      'Content-Type': 'application/json'
    };
  }
}

module.exports = {AuthorizationsVoidRequest: AuthorizationsVoidRequest};
