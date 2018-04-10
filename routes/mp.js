var express = require('express');
var request = require('request');
var router = express.Router();

var CLIENT_ID = 'ATAYvJcjSbUxHwoCrbqh0YCdyX9x-1xfPNQAgLByHN-nQkt3QWUZOkUbmVnzwqLYdv-GJ4DkHN2VzkeY';
var SECRET = 'EIQHgAI8GbrMg0v2MW6pNgGnNS4J8YUmiPrm69CPfbaIk2-c9TzC3tSx3ucYChdMimMYB11YWipW98tl';
var PP_ENV = 'sandbox';

var PARTNER_ID = 'XMSSFQGR93WPU';
var RETURN_URL = 'https://jo-pp-node-demo.herokuapp.com/mp';
var LOGO_URL = '';
var MERCHANT_ID = 'M1';


var path = 'sandbox.';
if (PP_ENV == 'production') path = '';

var API_ROOT = `https://api.${path}paypal.com`;

var URL_ONBOARD = `https://www.${path}paypal.com/us/merchantsignup/partner/onboardingentry?channelId=partner&productIntentId=addipmt` +
  `&partnerId=${PARTNER_ID}&returnToPartnerUrl=${RETURN_URL}&integrationType=TO&showPermissions=true` +
  `&features=PAYMENT,REFUND&partnerLogoUrl=${LOGO_URL}&merchantId=${MERCHANT_ID}&partnerClientId=${CLIENT_ID}`;


/*https://www.sandbox.paypal.com/webapps/merchantboarding/webflow/
externalpartnerflow?merchantId=okaura20160830967&productSelectionNeeded=TRUE
&countryCode=US&partnerId=UXTTV2MAAJDJE&displayMode=regular&productIntentID=addipmt&receiveCredentials=
FALSE&integrationType=T&showPermissions=TRUE&
returnToPartnerUrl=https://jo-pp-ruby-demo.herokuapp.com/ad
&permissionNeeded=EXPRESS_CHECKOUT,TRANSACTION_SEARCH,TRANSACTION_DETAILS,RECURRING_PAYMENTS,REFERENCE_TRANSACTION,BILLNG_AGREEMENT,AUTH_CAPTURE,REFUND
*/

router.get('/', function(req, res, next) {
  call_rest({"grant_type": "client_credentials"}, 'POST', true, function(api_res) {
    res.render('mp', { url_onboard: URL_ONBOARD, env: PP_ENV, api_res: JSON.stringify(api_res, null, 4)});
  });
});

var call_rest = function(json, method = 'GET', token = true, callback) {
  var headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en_US'
  };
  var options = {
    url: `${API_ROOT}/v1/oauth2/token`,
    method: method,
    headers: headers,
    json: true,
    form: json
  };
  if ( token == true) {
    options.auth = {
      user: CLIENT_ID,
      password: SECRET
    };
  } else {

  }
  request(options, function (error, response, body) {
    callback({error: JSON.stringify(error, null, 4), response: JSON.stringify(response, null, 4)});
  });
}

module.exports = router;
