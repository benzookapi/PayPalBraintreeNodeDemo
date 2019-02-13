## Braintree HttpClient

BraintreeHttp is a generic HTTP Client.

In it's simplest form, an [`HttpClient`](./lib/braintreehttp/http_client.js) exposes an `#execute` method which takes an `HttpRequest`, executes it against the domain described in an `Environment`, and returns a Promise.

### Environment

An [`Environment`](./lib/braintreehttp/environment.js) describes a domain that hosts a REST API, against which an `HttpClient` will make requests. `Environment` is a simple class that contains one property, `baseUrl`.

```js
let env = new Environment('https://example.com');
```

### Requests

HTTP requests contain all the information needed to make an HTTP request against the REST API. Specifically, one request describes a path, a verb, any path/query/form parameters, headers, attached files for upload, and body data. In Javascript, an HttpRequest is simply an object literal with `path`, `verb`, and optionally, `requestBody`, and `headers` populated.

### Responses

HTTP responses contain information returned by a server in response to a request as described above. They are simple objects which contain a `statusCode`, `headers`, and a `result`, which reprepsents any data returned by the server.

```js
let req = {
  path: "/path/to/resource",
  verb: "GET",
  headers: {
    "X-Custom-Header": "custom value"
  }
}

client.execute(req)
  .then((resp) => {
    let statusCode = resp.statusCode;
    let headers = resp.headers;
    let responseData = resp.result;
  });
```

### Injectors

Injectors are closures that can be used for executing arbitrary pre-flight logic, such as modifying a request or logging data. Injectors are attached to an `HttpClient` using the `#addInjector` method. They must take one argument (a request), and may return nothing, or a Promise.

The `HttpClient` executes its injectors in a first-in, first-out order, before each request.

```js
let client = new HttpClient(env);
client.addInjector((req) => {
  console.log(req);
});

client.addInjector((req) => {
  req.headers['Request-Id'] = 'abcd';
});

...
```

### Error Handling

The Promise returned by `HttpClient#execute` maybe be rejected if something went wrong during the course of execution. If the server returned a non-200 response, this error will be an object that contains a status code, headers, and any data that was returned for debugging.

```js
client.execute(req)
  .then((resp) => {
    let statusCode = resp.statusCode;
    let headers = resp.headers;
    let responseData = resp.result;
  })
  .catch((err) => {
    if (err.statusCode) {
      let statusCode = err.statusCode;
      let headers = err.headers;
      let message = err.message;
    } else {
      // Something else went wrong
      console.err(err);
    }
  });
```

### Serializer
(De)Serialization of request and response data is done by instances of [`Encoder`](./lib/braintreehttp/encoder.js). BraintreeHttp currently supports `json` encoding out of the box.

## License
BraintreeHttp-Node is open source and available under the MIT license. See the [LICENSE](./LICENSE) file for more info.

## Contributing
Pull requests and issues are welcome. Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.
