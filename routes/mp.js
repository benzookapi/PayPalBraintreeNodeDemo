var express = require('express');
var request = require('request');
var router = express.Router();

var CLIENT_ID = process.env.PP_MP_CLIENT_ID;
var SECRET = process.env.PP_MP_SECRET;
var PARTNER_ID = process.env.PP_MP_PARTNER_ID;
var ENV = process.env.PP_MP_ENV;
console.log(`CLIENT_ID: ${CLIENT_ID}`);
console.log(`SECRET: ${SECRET}`);
console.log(`PARTNER_ID: ${PARTNER_ID}`);
console.log(`ENV: ${ENV}`);

var RETURN_URL = 'http://localhost:3000/mp/order';
if (process.env.PP_MP_RETURN_URL !== undefined) {
  RETURN_URL = process.env.PP_MP_RETURN_URL;
}
var LOGO_URL = '';
var MERCHANT_ID = `benzo${new Date().getTime()}`;

var s = 'sandbox.';
if (ENV == 'production') s = '';

var API_ROOT = `https://api.${s}paypal.com/v1/`;
console.log(`API_ROOT: ${API_ROOT}`);

var URL_ONBOARD = `https://www.${s}paypal.com/us/merchantsignup/partner/onboardingentry?channelId=partner&productIntentId=addipmt` +
  `&partnerId=${PARTNER_ID}&returnToPartnerUrl=${RETURN_URL}&integrationType=TO&showPermissions=true` +
  `&features=PAYMENT,REFUND&partnerLogoUrl=${LOGO_URL}&merchantId=${MERCHANT_ID}&partnerClientId=${CLIENT_ID}`;
console.log(`URL_ONBOARD: ${URL_ONBOARD}`);

router.get('/', function(req, res, next) {
  get_token(function(access_token) {
    var ref_json = {
      "customer_data": {
       "customer_type": "MERCHANT",
       "person_details": {
         "email_address": "benzookapi+MP10@gmail.com",
         "name": {
           "prefix": "Mr.",
           "given_name": "BENZO",
           "surname": "OKA",
           "middle_name": "PIIIII"
         },
         "phone_contacts": [
           {
             "phone_number_details": {
             "country_code": "1",
             "national_number": "5417543010"
            },
            "phone_type": "HOME"
          }
        ],
        "home_address": {
          "line1": "421 E DRACHMAN",
          "state": "AZ",
          "city": "TUCSON",
          "country_code": "US",
          "postal_code": "85705-7598"
        },
        "date_of_birth": {
          "event_type": "BIRTH",
          "event_date": "1987-12-29T23:59:59.999Z"
        },
        "nationality_country_code": "US",
        "identity_documents": [
          {
            "type": "SOCIAL_SECURITY_NUMBER",
            "value": "1234",
            "partial_value": true,
            "issuer_country_code": "US"
          }
        ]
      },
       "business_details": {
        "phone_contacts": [
          {
            "phone_number_details": {
              "country_code": "1",
              "national_number": "5417543010"
            },
            "phone_type": "HOME"
          }
        ],
        "business_address": {
          "line1": "421 E DRACHMAN",
          "state": "AZ",
          "city": "TUCSON",
          "country_code": "US",
          "postal_code": "85705-7598"
        },
        "business_type": "PROPRIETORSHIP",
        "category": "1004",
        "sub_category": "2025",
        "names": [
          {
            "type": "LEGAL",
            "name": "SHASHANK STORE"
          }
        ],
        "business_description": "Arts and handicrafts",
        "event_dates": [
          {
            "event_type": "ESTABLISHED",
            "event_date": "2009-01-31T13:59:45Z"
          }
        ],
        "website_urls": [
          "https://github.com/benzookapi/PayPalBraintreeNodeDemo"
        ],
        "annual_sales_volume_range": {
          "minimum_amount": {
            "currency": "USD",
            "value": "2000"
          },
          "maximum_amount": {
            "currency": "USD",
            "value": "3000"
          }
        },
        "average_monthly_volume_range": {
          "minimum_amount": {
            "currency": "USD",
            "value": "2000"
          },
          "maximum_amount": {
            "currency": "USD",
            "value": "3000"
          }
        },
        "identity_documents": [
          /*{
            "type": "TAX_IDENTIFICATION_NUMBER",
            "value": "ABCDEF34646",
            "partial_value": false,
            "issuer_country_code": "US"
          }*/
        ],
        "email_contacts": [
          {
            "email_address": "benzookapi+MP10@gmail.com",
            "role": "CUSTOMER_SERVICE"
          }
        ]
       },
       "financial_instrument_data": {
        /*"bank_details": [
          {
            "nick_name": "Bank of America",
            "account_number": "123405668293",
            "account_type": "CHECKING",
            "currency_code": "USD",
            "identifiers": [
              {
                "type": "ROUTING_NUMBER_1",
                "value": "123456789"
              }
            ]
          }
        ]*/
       },
       "preferred_language_code": "en_US",
       "primary_currency_code": "USD",
       "referral_user_payer_id": {
         "type": "PAYER_ID",
         "value": PARTNER_ID
       },
       "partner_specific_identifiers": [
        {
          "type": "TRACKING_ID",
          "value": MERCHANT_ID
        }
       ]
      },
      "requested_capabilities": [{
        "capability": "API_INTEGRATION",
        "api_integration_preference": {
          "partner_id": PARTNER_ID,
          "rest_api_integration": {
            "integration_method": "PAYPAL",
            "integration_type": "THIRD_PARTY"
          },
          "rest_third_party_details": {
            "partner_client_id": CLIENT_ID,
            "feature_list": [
              "PAYMENT",
              "REFUND"
            ]
          }
        }
      }],
      "web_experience_preference": {
       "partner_logo_url": LOGO_URL,
       "return_url": RETURN_URL,
       "action_renewal_url": RETURN_URL
      },
      "collected_consents": [
       {
        "type": "SHARE_DATA_CONSENT",
        "granted": true
       }
      ],
      "products": [
       "EXPRESS_CHECKOUT"
      ]
    };
    call_rest('customer/partner-referrals', ref_json, 'POST', access_token, function(api_res) {
      console.log(JSON.stringify(api_res, null ,4));
      res.render('mp', { url_method: URL_ONBOARD, upfront_url: api_res.body.links[1].href});
    });
  });
});

router.get('/order', function(req, res, next) {
  receiver = '';
  body = '';
  if (req.query.merchantIdInPayPal !== undefined) {
    receiver = req.query.merchantIdInPayPal;
    get_token(function(access_token) {
      call_rest(`customer/partners/${PARTNER_ID}/merchant-integrations/${receiver}`, {}, 'GET', access_token, function(api_res) {
        console.log(JSON.stringify(api_res, null ,4));
        body = JSON.stringify(api_res.body);
        res.render('mp_order', { env: ENV, receiver: receiver, body: body,
          order_url: `${RETURN_URL}/create?merchantIdInPayPal=${receiver}`, pay_url: `${RETURN_URL}/pay`});
      });
    });
  } else {
    res.render('mp_order', { env: ENV, receiver: receiver, body, order_url: '', pay_url: ''});
  }
});

router.post('/order/create', function(req, res) {
  get_token(function(access_token) {
    var order_json = {
      "purchase_units": [{
        "reference_id": `pu1_forward fashions ${new Date().getTime()}`,
        "description": "pu1_description",
        "amount": {
            "currency": "USD",
            "details": {
                "subtotal": "100.00",
                "shipping": "0.00",
                "tax": "0.00"
            },
            "total": "100.00"
        },
        "payee": {
            "merchant_id": req.query.merchantIdInPayPal
        },
        "items": [{
            "name": "Denim Woven Shirt",
            "sku": `sku${new Date().getTime()}`,
            "price": "100.00",
            "currency": "USD",
            "quantity": 1,
            "category": "PHYSICAL",
            "supplementary_data": [],
            "postback_data": [],
            "item_option_selections": []
        }],
        "shipping_address": {
            "recipient_name": "John Doe",
            "default_address": false,
            "preferred_address": false,
            "primary_address": false,
            "disable_for_transaction": false,
            "line1": "2211 N First Street",
            "line2": "Building 17",
            "city": "San Jose",
            "country_code": "US",
            "postal_code": "95131",
            "state": "CA",
            "phone": "(123) 456-7890"
        },
        "shipping_method": "United Postal Service",
        "partner_fee_details": {
            "receiver": {
                //"email": "xxxx",
                "merchant_id": PARTNER_ID
            },
            "amount": {
                "value": "16.80",
                "currency": "USD"
            }
        },
        "payment_linked_group": 1,
        "custom": "oren",
        "invoice_number": `invoice_oren_${new Date().getTime()}`,
        "payment_descriptor": "Example_Marketplace"
      }],
      "metadata": {
        "supplementary_data": [],
        "postback_data": []
      },
      "redirect_urls": {
        "return_url": RETURN_URL,
        "cancel_url": RETURN_URL
      }
    };
    console.log(JSON.stringify(order_json, null, 4));
    call_rest(`checkout/orders`, order_json, 'POST', access_token, function(api_res) {
      console.log(JSON.stringify(api_res, null ,4));
      res.header('Content-Type', 'application/json; charset=utf-8');
      res.send(api_res.body);
    });
  });
});

router.post('/order/pay', function(req, res) {
  //console.log(JSON.stringify(req.body));
  get_token(function(access_token) {
    var pay_json = {
      "disbursement_mode": "INSTANT"
      //"disbursement_mode": "DELAYED"
    };
    call_rest(`checkout/orders/${req.body.orderID}/pay`, pay_json, 'POST', access_token, function(api_res) {
      console.log(JSON.stringify(api_res, null ,4));
      res.header('Content-Type', 'application/json; charset=utf-8');
      res.send(api_res.body);
    });
  });
});

var get_token = function(callback) {
  call_rest('oauth2/token', {"grant_type": "client_credentials"}, 'POST', null, function(api_res) {
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
