var express = require('express');
var router = express.Router();

const paypal = require('@paypal/checkout-server-sdk');
const clientId = process.env.PP_API_APP_REST;
const clientSecret = process.env.PP_API_APP_REST_SEC;
console.log(`clientId: ${clientId}`);
console.log(`clientSecret: ${clientSecret}`);
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);
const currency = "JPY";
console.log(`currency: ${currency}`);

router.get('/', function(req, res, next) { 
  res.render('index', {client_id: clientId, currency: currency});    
});

router.post('/createorder', async function(req, res) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
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
    return res.send(500);
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
    return res.send(500);
  }
  res.status(200).json(capture); 
});

module.exports = router;