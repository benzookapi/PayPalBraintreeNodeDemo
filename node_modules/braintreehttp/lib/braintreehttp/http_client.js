'use strict';

let http = require('http');
let https = require('https');
let Buffer = require('buffer').Buffer;
let url = require('url');
let Encoder = require('./encoder').Encoder;
let zlib = require('zlib');
let Json = require('./serializer/json').Json;
let Text = require('./serializer/text').Text;
let Multipart = require('./serializer/multipart').Multipart;
let FormEncoded = require('./serializer/form_encoded').FormEncoded;

const THIRTY_SECONDS = 10 * 3000;

class HttpError extends Error {
  constructor(response) {
    super();

    this.message = response.message || response.text || 'An unknown error occured.';
    this.statusCode = response.statusCode;
    this.headers = response.headers;
    this._originalError = response;
  }
}

class HttpClient {

  constructor(environment) {
    this.environment = environment;
    this._injectors = [];
    this.encoder = new Encoder([new Json(), new Text(), new Multipart(), new FormEncoded()]);
  }

  getUserAgent() {
    return 'BraintreeHttp-Node HTTP/1.1';
  }

  getTimeout() {
    return THIRTY_SECONDS;
  }

  addInjector(injector) {
    if (typeof injector !== 'function' || injector.length !== 1) {
      throw new Error('injector must be a function that takes one argument');
    }

    this._injectors.push(injector);
  }

  execute(req) {
    let request = Object.assign({}, req);

    if (!request.headers) {
      request.headers = {};
    }

    let injectorPromises = this._injectors.map(function (injector) {
      return injector(request);
    });

    let requestBody, requestAborted;
    let client = this.environment.baseUrl.startsWith('https') ? https : http;

    let parsedUrl = url.parse(this.environment.baseUrl);

    request.host = parsedUrl.hostname;
    request.port = parsedUrl.port;

    if (!request.headers['User-Agent'] || request.headers['User-Agent'] === 'Node') {
      request.headers['User-Agent'] = this.getUserAgent();
    }

    if (request.body) {
      requestBody = this.encoder.serializeRequest(request);
      request.headers['Content-Length'] = Buffer.byteLength(requestBody).toString();
    }

    if (request.verb) {
      request.method = request.verb;
    }

    return new Promise((resolve, reject) => {
      return Promise.all(injectorPromises).then(() => {
        let theRequest = client.request(request, (response) => {
          let buffers = [];

          response.on('data', (responseBody) => {
            buffers.push(responseBody);
          });

          response.on('end', () => {
            let contentEncoding = response.headers['content-encoding'] || response.headers['Content-Encoding'];

            let body = Buffer.concat(buffers);

            if (contentEncoding === 'gzip') {
              body = zlib.gunzipSync(body);
            }

            body = body.toString('utf8');

            if (response.statusCode >= 200 && response.statusCode <= 299) {
              resolve(this._parseResponse(body, response));
            } else {
              reject(new HttpError({
                text: body,
                statusCode: response.statusCode,
                headers: response.headers
              }));
            }
          });

          response.on('error', reject);
        });

        function timeoutHandler() {
          theRequest.abort();
          requestAborted = true;

          reject(new Error('Request timed out'));
        }

        theRequest.setTimeout(this.getTimeout(), timeoutHandler);

        let requestSocket = null;

        theRequest.on('socket', (socket) => {
          requestSocket = socket;
        });

        theRequest.on('error', (error) => {
          if (requestAborted) { return; }
          requestSocket.removeListener('timeout', timeoutHandler);

          reject(error);
        });

        if (requestBody) {
          theRequest.write(requestBody);
        }
        theRequest.end();
      }).catch(reject);
    });
  }

  _parseResponse(body, response) {
    var data = {
      statusCode: response.statusCode,
      headers: response.headers
    };

    if (body) {
      data.result = this.encoder.deserializeResponse(body, response.headers);
    }

    return data;
  }
}

module.exports = {HttpClient: HttpClient};
