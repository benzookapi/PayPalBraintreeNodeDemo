const createOrder = require('./createOrder').createOrder;
const captureOrder = require('./captureOrder').captureOrder;
const refundOrder = require('../Common/refundOrder').refundOrder;

(async() => {
    let response = await createOrder();
    console.log("Creating Order...");
    let orderId = "";
    if (response.statusCode === 201){
        console.log("Created Successfully");
        orderId = response.result.id;
        console.log("Links:");
        response.result.links.forEach((item, index) => {
            let rel = item.rel;
            let href = item.href;
            let method = item.method;
            let message = `\t${rel}: ${href}\tCall Type: ${method}`;
            console.log(message);
        });
    }

    console.log("Copy approve link and paste it in browser. Login with buyer account and follow the instructions.\nOnce approved hit enter...");

    function prompt(question) {
        return new Promise((resolve, reject) => {
            const stdin = process.stdin;
            const stdout = process.stdout;
            stdin.resume();
            stdout.write(question);

            stdin.on('data', data => resolve(data.toString().trim()));
            stdin.on('error', err => reject(err));
        });
    }

    await prompt('');

    console.log('Capturing Order...');
    response = await captureOrder(orderId);
    let captureId = "";
    if (response.statusCode === 201){
        console.log("Captured Successfully");
        console.log("Status Code: " + response.statusCode);
        console.log("Status: " + response.result.status);
        console.log("Order ID: " + response.result.id);
        console.log("Capture Ids:");
        response.result.purchase_units.forEach((item,index)=>{
        	item.payments.captures.forEach((item, index)=>{
        		console.log("\t"+item.id);
        		captureId = item.id;
            });
        });
        console.log("Links: ");
        response.result.links.forEach((item, index) => {
            let rel = item.rel;
            let href = item.href;
            let method = item.method;
            let message = `\t${rel}: ${href}\tCall Type: ${method}`;
            console.log(message);
        });
    }
    
    console.log('Refunding Order...');
    response = await refundOrder(captureId);
    if (response.statusCode === 201){
        console.log("Refunded Successfully");
        console.log("Status Code: " + response.statusCode);
        console.log("Status: " + response.result.status);
        console.log("Refund ID: " + response.result.id);
        console.log("Links: ");
        response.result.links.forEach((item, index) => {
            let rel = item.rel;
            let href = item.href;
            let method = item.method;
            let message = `\t${rel}: ${href}\tCall Type: ${method}`;
            console.log(message);
        });
    }
    
    process.exit();
})();