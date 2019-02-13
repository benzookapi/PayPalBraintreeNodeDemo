# PayPal Checkout API SDK for NodeJS

![PayPal Developer](/homepage.jpg)

__Welcome to PayPal NodeJS SDK__. This repository contains PayPal's NodeJS SDK and samples for REST API.

This is a part of the next major PayPal SDK. It includes a simplified interface to only provide simple model objects and blueprints for HTTP calls. This repo currently contains functionality for PayPal Checkout APIs which includes Orders V2 and Payments V2.

## Please Note
> **The Payment Card Industry (PCI) Council has [mandated](http://blog.pcisecuritystandards.org/migrating-from-ssl-and-early-tls) that early versions of TLS be retired from service.  All organizations that handle credit card information are required to comply with this standard. As part of this obligation, PayPal is updating its services to require TLS 1.2 for all HTTPS connections. At this time, PayPal will also require HTTP/1.1 for all connections. [Click here](https://github.com/paypal/tls-update) for more information. Connections to the sandbox environment use only TLS 1.2.**

## Direct Credit Card Support
> **Important: The PayPal REST API no longer supports new direct credit card integrations.**  Please instead consider [Braintree Direct](https://www.braintreepayments.com/products/braintree-direct); which is, PayPal's preferred integration solution for accepting direct credit card payments in your mobile app or website. Braintree, a PayPal service, is the easiest way to accept credit cards, PayPal, and many other payment methods.

## Examples
### Creating an Order
#### Code to Execute:
```javascript
const paypal = require('@paypal/checkout-server-sdk');

// Creating an environment
let clientId = "<<CLIENT-ID>>";
let clientSecret = "<<CLIENT-SECRET>>";
let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
let client = new paypal.core.PayPalHttpClient(environment);

// Construct a request object and set desired parameters
// Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
let request = new paypal.orders.OrdersCreateRequest();
request.requestBody({
                          "intent": "CAPTURE",
                          "purchase_units": [
                              {
                                  "amount": {
                                      "currency_code": "USD",
                                      "value": "100.00"
                                  }
                              }
                           ]
                    });

try {
    // Call API with your client and get a response for your call
    let response = await client.execute(request);  
    
    // If call returns body in response, you can get the deserialized version from the result attribute of the response
    let order = response.result;
    console.log(order);
}
catch(error){
    console.error(error.statusCode);
    console.error(error.message);
}
```
#### Example Output:
```
{ id: '24095053SH7271302',
  intent: 'CAPTURE',
  gross_amount: { currency_code: 'USD', value: '100.00' },
  purchase_units: [ { amount: [Object] } ],
  create_time: '2018-08-27T19:22:03Z',
  links: 
   [ { href: 'https://api.sandbox.paypal.com/v2/checkout/orders/24095053SH7271302',
       rel: 'self',
       method: 'GET' },
     { href: 'https://www.sandbox.paypal.com/checkoutnow?token=24095053SH7271302',
       rel: 'approve',
       method: 'GET' },
     { href: 'https://api.sandbox.paypal.com/v2/checkout/orders/24095053SH7271302/capture',
       rel: 'capture',
       method: 'POST' } ],
  status: 'CREATED' }
```

## Capturing an Order

### Code to Execute:
```javascript
// Here, OrdersCaptureRequest() creates a POST request to /v2/checkout/orders
// order.id gives the orderId of the order created above
request = new paypal.orders.OrdersCaptureRequest(order.id);
request.requestBody({});

try {
    // Call API with your client and get a response for your call
    response = await client.execute(request);   
    
    // If call returns body in response, you can get the deserialized version from the result attribute of the response
    order = response.result;
    console.log(order);
}
catch(error){
    console.error(error.statusCode);
    console.error(error.message);
}
```

#### Example Output:
```
Status Code: 201
Id: 8GB67279RC051624C
Create_time: 2018-08-06T23:39:11Z
Update_time: 2018-08-06T23:39:11Z
Payer:
	Name:
		Given_name: test
		Surname: buyer
	Email_address: ganeshramc-buyer@live.com
	Payer_id: KWADC7LXRRWCE
	Phone:
		Phone_number:
			National_number: 408-411-2134
	Address:
		Country_code: US
Links:
	1:
		Href: https://api.sandbox.paypal.com/v2/checkout/orders/3L848818A2897925Y
		Rel: self
		Method: GET
Status: COMPLETED
```

## Running tests

To run integration tests using your client id and secret, clone this repository and run the following command:
```sh
$ npm install
$ npm test
```

*NOTE*: This SDK is still in beta, is subject to change, and should not be used in production.

## Samples

You can start off by trying out [creating and capturing an order](https://github.com/paypal/Checkout-NodeJS-SDK/tree/master/samples/CaptureIntentExamples/runAll.js)

To try out different samples for both create and authorize intent check [this link](https://github.com/paypal/Checkout-NodeJS-SDK/tree/master/samples)

## Note

BraintreeHttpClient used as part of this project returns Promises

You can read more about Promises here: https://www.promisejs.org/


