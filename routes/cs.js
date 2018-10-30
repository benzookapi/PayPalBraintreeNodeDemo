var express = require('express');
var request = require('request');
var router = express.Router();

var CLIENT_ID_CS = process.env.PP_CS_CLIENT_ID;
var SECRET_CS = process.env.PP_CS_SECRET;
var ENV_CS = process.env.PP_CS_ENV;
console.log(`CLIENT_ID_CS: ${CLIENT_ID_CS}`);
console.log(`SECRET_CS: ${SECRET_CS}`);
console.log(`ENV_CS: ${ENV_CS}`);

var RETURN_URL_CS = 'http://localhost:3000/cs';
if (process.env.PP_CS_RETURN_URL !== undefined) {
  RETURN_URL_CS = process.env.PP_CS_RETURN_URL;
}

var s = 'sandbox.';
if (ENV_CS == 'production') s = '';

var API_ROOT_CS = `https://api.${s}paypal.com/v1/`;
console.log(`API_ROOT_CS: ${API_ROOT_CS}`);

router.get('/', function(req, res, next) {
  get_token(function(access_token) {
    var ref_json = {
      "person_details": {
        "names": [{
          "given_name": "一郎",
          "surname": "ペイパル"
         }],
        "phone_contacts": [{
          "phone": {
          "country_code": "81",
          "national_number": "9012345678"
        },
          "phone_type": "HOME"
        }],
        "addresses": [{
          "address": {
            "line1": "北青山",
            "line2": "１−２−３",
            "city": "港区",
            "state": "東京都",
            "country_code": "JP",
            "postal_code": "1234567"
          }
        }],
        "email_addresses": [{
          "email_address": "jokksk-cs123@gmail.com",
          "primary": true,
          "confirmed": true
        }],
        "origin_country_code": "JP",
        "date_of_birth": {
          "date": "1980-01-01",
          "confirmation": {
            "status": "CONFIRMED" // or "NONE"
          }
        }
      },
      "paypal_account_properties": {
        "account_country_code": "JP",
        "flow_intent": "CREATE_ACCOUNT"
      },
      "financial_instruments": {
        "card_accounts": [{
          "account_number": "4285208988040967",
          "type": "VISA",
          "expiry_month": "11",
          "expiry_year": "2019",
          "country_code": "JP",
          "confirmation": {
            "status": "CONFIRMED" // or "NONE"
          }
        }]/*,
        "bank_details": [
          {
            "nick_name": "ゆうちょ銀行",
            "account_number": "123405668293",
            "account_type": "SAVING",
            "currency_code": "JPY",
            "country_code": "JP"
          }
        ]*/
      }
    };
    call_rest('customer/consumer-referrals', ref_json, 'POST', access_token, function(api_res) {
      console.log(JSON.stringify(api_res, null ,4));
      var u = api_res.body.links[0].href;
      var url = u.replace(/(.+)\?referralid=(.+)/g, "$1");
      var refid = u.replace(/(.+)\?referralid=(.+)/g, "$2");
      res.render('cs', { upfront_url: api_res.body.links[0].href, url: url, refid: refid, rtn: RETURN_URL_CS});
    });
  });
});

var get_token = function(callback) {
  call_rest('oauth2/token', {"grant_type": "client_credentials"}, 'POST', null, function(api_res) {
    console.log(JSON.stringify(api_res, null ,4));
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
    url: `${API_ROOT_CS}${path}`,
    method: method
    //json: true,
    //form: json
  };
  if (access_token === null) {
    options.auth = {
      user: CLIENT_ID_CS,
      password: SECRET_CS
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
