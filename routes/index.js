var express = require('express');
var request = require('request');

var router = express.Router();

// PayPal Checkout SDK
const paypal = require('@paypal/checkout-server-sdk');
const CLIENT_ID = process.env.PP_API_APP_REST;
const SECRET = process.env.PP_API_APP_REST_SEC;
console.log(`CLIENT_ID: ${CLIENT_ID}`);
console.log(`SECRET: ${SECRET}`);

console.log(`PP_PROD: ${process.env.PP_PROD}`);
var environment;
if (process.env.PP_PROD == 'true') {
  environment = new paypal.core.LiveEnvironment(CLIENT_ID, SECRET);
} else {
  environment = new paypal.core.SandboxEnvironment(CLIENT_ID, SECRET);
}
const client = new paypal.core.PayPalHttpClient(environment);

const CURRENCY = "JPY";
console.log(`CURRENCY: ${CURRENCY}`);

var buyer_country_param = "";
if (process.env.PP_BUYER_COUNTRY !== undefined && process.env.PP_PROD != 'true') buyer_country_param = "buyer-country=" + process.env.PP_BUYER_COUNTRY;

// Direct API Call
var s = 'sandbox.';
if (process.env.PP_PROD == 'true') s = '';
const API_ROOT = `https://api.${s}paypal.com/`;
console.log(`API_ROOT: ${API_ROOT}`);
console.log(`buyer_country_param: ${buyer_country_param}`);

// *********  SDK Integrations ********* //

router.get('/', function(req, res, next) { 
  res.render('index', {client_id: CLIENT_ID, currency: CURRENCY, buyer_country_param: buyer_country_param});    
});

router.post('/verifyorder', async function(req, res) {
  const orderID = req.body.orderID;
  console.error("orderID " + orderID);
  const request = new paypal.orders.OrdersGetRequest(orderID);
  let order;
  try {
    order = await client.execute(request);
  } catch (err) {
    console.error(err);
    return res.send("<h2>ERROR!</h2>" + JSON.stringify(err, null, 4).replace(/\n/g, "\n<br/>").replace(/ /g, " &nbsp;"));
  }
  //if (order.result.purchase_units[0].amount.value !== '220.00') {
  //  return res.send(400);
  //}
  res.send("<h2>SUCCESS!</h2>" + JSON.stringify(order, null, 4).replace(/\n/g, "\n<br/>").replace(/ /g, " &nbsp;"));
});

router.post('/createorder', async function(req, res) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: CURRENCY,
        value: '2000'
      }
    }]
  });  
  let order;
  try {
    order = await client.execute(request);
    console.log(JSON.stringify(order, null, 4));
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }  
  res.status(200).json({
    orderID: order.result.id
  }); 
});

router.post('/captureorder', async function(req, res) {
  const orderID = req.body.orderID;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});
  let capture;
  try {
    capture = await client.execute(request);
    console.log(JSON.stringify(capture, null, 4));
    const captureID = capture.result.purchase_units[0]
        .payments.captures[0].id;
    //await database.saveCaptureID(captureID);
  } catch (err) {
    console.error(err);    
    return res.send("<h2>ERROR!</h2>" + JSON.stringify(err, null, 4).replace(/\n/g, "\n<br/>").replace(/ /g, " &nbsp;"));
  }  
  res.send("<h2>SUCCESS!</h2>" + JSON.stringify(capture, null, 4).replace(/\n/g, "\n<br/>").replace(/ /g, " &nbsp;"));
});

// *********  Direct Call Integrations ********* //

router.get('/rt', function(req, res, next) {
  res.render('rt', {client_id: CLIENT_ID, currency: CURRENCY, buyer_country_param: buyer_country_param});    
});

router.post('/agreetoken', function(req, res) {
  get_token(function(access_token) {
    call_rest('v1/billing-agreements/agreement-tokens', {
      "description": "My Billing Agreement!!",
      "shipping_address":
      {
        "line1": "Aoyama -1",
        "city": "Minato-ku",
        "state": "Tokyo",
        "postal_code": "1234567",
        "country_code": "JP",
        "recipient_name": "RT Taro"
      },
      "payer":
      {
        "payment_method": "PAYPAL"
      },
      "plan":
      {
        "type": "MERCHANT_INITIATED_BILLING",
        "merchant_preferences":
        {
          "return_url": "https://www.paypal.com/checkoutnow/error",
          "cancel_url": "https://www.paypal.com/checkoutnow/error",
          "accepted_pymt_type": "INSTANT",
          "skip_shipping_address": false,
          "immutable_shipping_address": true
        }
      }
    }, 'POST', access_token, function(api_res) {
      console.log(JSON.stringify(api_res, null ,4));
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.status(200).json({
        billingToken: api_res.body.token_id
      }); 
    });    
  });
});

router.post('/createbilling', function(req, res) {
  const billingToken = req.body.billingToken;
  get_token(function(access_token) {
    call_rest('v1/billing-agreements/agreements', {
        "token_id": billingToken
      }, 'POST', access_token, function(api_res) {
      console.log(JSON.stringify(api_res, null ,4));
      res.send("<h2>SUCCESS!</h2>" + JSON.stringify(api_res.body, null, 4).replace(/\n/g, "\n<br/>").replace(/ /g, " &nbsp;")+ "<br/><br/><h2><a href=\"https://jo-pp-ruby-demo.herokuapp.com/rest\" target=\"_blank\">Use your billing_agreement_id in REST payment</a></h2>");
    });    
  });
});

router.get('/hostedpp', function(req, res, next) {
  get_token(function(access_token) {
    res.render('hostedpp', {client_id: CLIENT_ID, currency: CURRENCY, buyer_country_param: buyer_country_param});    
  });
});

var get_token = function(callback) {
  call_rest('v1/oauth2/token', {"grant_type": "client_credentials"}, 'POST', null, function(api_res) {
    //console.log(JSON.stringify(api_res, null ,4));
    var r = JSON.parse(api_res.body);
    callback(r.access_token);
  });
};

var call_rest = function(path, json, method = 'GET', access_token = null, callback) {
  var headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en_US'
  };
  var options = {
    url: `${API_ROOT}${path}`,
    method: method
    //json: true,
    //form: json
  };
  if (access_token === null) {
    options.auth = {
      user: CLIENT_ID,
      password: SECRET
    };
    options.form = json;
  } else {
    options.auth = {
      bearer: access_token
    };
    headers['Content-Type'] = 'application/json';
    options.json = json;
  }
  options.headers = headers;
  request(options, function (error, response, body) {
    callback({error: error, response: response, body: body});
  });
};

module.exports = router;