var express = require('express');
var router = express.Router();
var braintree = require('braintree')

/* GET home page. */
router.get('/', function(req, res, next) {
  var gateway = braintree.connect({
    accessToken: 'access_token$sandbox$btdxhpwfbt6dy2vt$41c6f24f692e018e2c68d84ce235fe79'
  });
  gateway.clientToken.generate({}, function (err, response) {
    res.render('index', { clientToken: response.clientToken });
  });
});

router.post("/checkout", function (req, res) {
  // Use payment method nonce here
  var gateway = braintree.connect({
    accessToken: 'access_token$sandbox$btdxhpwfbt6dy2vt$41c6f24f692e018e2c68d84ce235fe79'
　});
  var saleRequest = {
    amount: req.body.amount,
    merchantAccountId: "JPY",
    paymentMethodNonce: "" + req.body.payment_method_nonce,
    options: {
      submitForSettlement: true
    }
  };
  gateway.transaction.sale(saleRequest, function (err, result) {
    if (err) {
      res.send("<h1>Error:  " + err + "</h1>");
    } else if (result.success) {
      res.send("<h1>Success! Transaction ID: " + result.transaction.id + "</h1>");
    } else {
      res.send("<h1>Error:  " + result.message + "</h1>");
    }
  });
});

/* ------- For Vault -------- */

router.get('/vault', function(req, res, next) {
  var gateway = braintree.connect({
    accessToken: 'access_token$sandbox$btdxhpwfbt6dy2vt$41c6f24f692e018e2c68d84ce235fe79'
  });
  gateway.clientToken.generate({}, function (err, response) {
    res.render('vault', { clientToken: response.clientToken });
  });
});

router.post("/checkoutVault", function (req, res) {
  // Use payment method nonce here
  var gateway = braintree.connect({
    accessToken: 'access_token$sandbox$btdxhpwfbt6dy2vt$41c6f24f692e018e2c68d84ce235fe79'
　});
  var saleRequest = {
    amount: req.body.amount,
    merchantAccountId: "JPY",
    paymentMethodNonce: "" + req.body.payment_method_nonce,
    deviceData: req.body.device,
    options: {
      submitForSettlement: true,
      storeInVaultOnSuccess: true // For Vault
    }
  };
  gateway.transaction.sale(saleRequest, function (err, result) {
    if (err) {
      res.send("<h1>Error:  " + err + "</h1>");
    } else if (result.success) {
      res.send("<h1>Success! Transaction ID: " + result.transaction.id + " Customer ID: " + result.transaction.customer.id + "</h1>");
    } else {
      res.send("<h1>Error:  " + result.message + "</h1>");
    }
  });
});

router.get('/vault_sale', function(req, res, next) {
  res.render('vault_sale');
});

router.post("/vaultSale", function (req, res) {
  // Use payment method nonce here
  var gateway = braintree.connect({
    accessToken: 'access_token$sandbox$btdxhpwfbt6dy2vt$41c6f24f692e018e2c68d84ce235fe79'
　});
  var saleRequest = {
    amount: req.body.amount,
    merchantAccountId: "JPY",
    customerId: req.body.customerId,
    options: {
      submitForSettlement: true
    }
  };
  gateway.transaction.sale(saleRequest, function (err, result) {
    if (err) {
      res.send("<h1>Error:  " + err + "</h1>");
    } else if (result.success) {
      res.send("<h1>Success! Transaction ID: " + result.transaction.id + "</h1>");
    } else {
      res.send("<h1>Error:  " + result.message + "</h1>");
    }
  });
});

/*------ For Hosted Field ------*/

router.get('/hosted', function(req, res, next) {
  var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "sqhrsttx42vpt63j",
    publicKey: "xwztjydf2g7zkdsw",
    privateKey: "532d0a43a6ca6796b77d824ea60f88e0"
  });
  gateway.clientToken.generate({}, function (err, response) {
    res.render('hosted', { clientToken: response.clientToken });
  });
});

router.post("/checkoutHosted", function (req, res) {
  // Use payment method nonce here
  var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "sqhrsttx42vpt63j",
    publicKey: "xwztjydf2g7zkdsw",
    privateKey: "532d0a43a6ca6796b77d824ea60f88e0"
  });
  console.log("%s %s", req.body.amount, req.body.payment_method_nonce)
  var saleRequest = {
    amount: req.body.amount,
    paymentMethodNonce: "" + req.body.payment_method_nonce,
    options: {
      submitForSettlement: true
    }
  };
  gateway.transaction.sale(saleRequest, function (err, result) {
    if (err) {
      res.send("<h1>Error:  " + err + "</h1>");
    } else if (result.success) {
      res.send("<h1>Success! Transaction ID: " + result.transaction.id + "</h1>");
    } else {
      res.send("<h1>Error:  " + result.message + "</h1>");
    }
  });
});

module.exports = router;
