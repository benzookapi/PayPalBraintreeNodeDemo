var express = require('express');
var request = require('request');
var router = express.Router();

var CLIENT_ID = process.env.PP_API_APP_REST;
var SECRET = process.env.PP_API_APP_REST_SEC;
var s = 'sandbox.';
if (process.env.PP_PROD == 'true') s = '';
var API_ROOT = `https://api.${s}paypal.com/`;
console.log(`API_ROOT: ${API_ROOT}`);
console.log(`CLIENT_ID: ${CLIENT_ID}`);
console.log(`SECRET: ${SECRET}`);

router.get('/', function(req, res, next) {
  get_token(function(access_token) {
    res.render('hostedpp', {client_id: CLIENT_ID});    
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