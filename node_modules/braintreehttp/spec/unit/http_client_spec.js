'use strict';
/* eslint-disable new-cap, no-unused-vars, no-invalid-this */

let braintreehttp = require('../../lib/braintreehttp');
let FormPart = require('../../lib/braintreehttp/serializer/multipart').FormPart;
let nock = require('nock');
let sinon = require('sinon');
let fs = require('fs');
let zlib = require('zlib');
let Busboy = require('busboy');

describe('HttpClient', function () {
  let environment = new braintreehttp.Environment('https://localhost:5000');

  beforeEach(function () {
    this.context = nock(environment.baseUrl);
    this.http = new braintreehttp.HttpClient(environment);
  });

  describe('getUserAgent', function () {
    it('returns the user agent', function () {
      assert.equal(this.http.getUserAgent(), 'BraintreeHttp-Node HTTP/1.1');
    });
  });

  describe('getTimeout', function () {
    it('returns the timeout of 30 seconds', function () {
      assert.equal(this.http.getTimeout(), 30000);
    });
  });

  describe('addInjector', function () {
    it('adds to the injectors array', function () {
      function injector(request) {}

      assert.equal(this.http._injectors.length, 0);

      this.http.addInjector(injector);

      assert.equal(this.http._injectors.length, 1);
    });

    it('throws an error if injector is not a function', function () {
      assert.throws(() => {
        this.http.addInjector({});
      }, /^injector must be a function that takes one argument$/);
    });

    it('throws an error if injector takes no or > 1 arguments', function () {
      assert.throws(() => {
        this.http.addInjector(function () {});
      }, /^injector must be a function that takes one argument$/);

      assert.throws(() => {
        this.http.addInjector(function (one, two) {});
      }, /^injector must be a function that takes one argument$/);
    });
  });

  describe('execute', function () {
    it('initialized with environment and base url', function () {
      assert.equal(this.http.environment.baseUrl, 'https://localhost:5000');
    });

    it('uses injectors to modify a request', function () {
      let headers = {
        'some-key': 'Some Value'
      };

      this.context.get('/')
        .reply(200, function (uri, body) {
          assert.equal(this.req.headers['some-key'], headers['some-key']);
        });

      function injector(request) {
        request.headers = headers;
      }

      this.http.addInjector(injector);

      let request = {
        verb: 'GET',
        path: '/'
      };

      return this.http.execute(request);
    });

    it('does not mutate original request', function () {
      let headers = {
        'some-key': 'Some Value'
      };

      this.context.get('/')
        .reply(200, function (uri, body) {
          assert.equal(this.req.headers['some-key'], headers['some-key']);
        });

      function injector(request) {
        request.headers = headers;
      }

      this.http.addInjector(injector);

      let request = {
        verb: 'GET',
        path: '/'
      };

      return this.http.execute(request).then(() => {
        assert.equal(null, request.headers);
      });
    });

    it('sets user agent if not set', function () {
      let request = {
        verb: 'GET',
        path: '/'
      };

      this.context.get('/')
        .reply(200, function (uri, body) {
          assert.equal(this.req.headers['user-agent'], 'BraintreeHttp-Node HTTP/1.1');
        });

      return this.http.execute(request);
    });

    it('sets user agent if user agent set to Node', function () {
      let request = {
        verb: 'GET',
        path: '/',
        headers: {'User-Agent': 'Node'}
      };

      this.context.get('/')
        .reply(200, function (uri, body) {
          assert.equal(this.req.headers['user-agent'], 'BraintreeHttp-Node HTTP/1.1');
        });

      return this.http.execute(request);
    });

    it('does not override user agent if set', function () {
      let request = {
        verb: 'GET',
        path: '/',
        headers: {'User-Agent': 'Not Node/1.1'}
      };

      this.context.get('/')
        .reply(200, function (uri, body) {
          assert.equal(this.req.headers['user-agent'], 'Not Node/1.1');
        });

      return this.http.execute(request);
    });

    it('uses body in request', function () {
      let request = {
        verb: 'POST',
        path: '/',
        body: {
          someKey: 'val',
          someVal: 'val2'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      };

      this.context.post('/').reply(200, function (uri, body) {
        assert.equal(body.someKey, 'val');
        assert.equal(body.someVal, 'val2');
      });

      return this.http.execute(request);
    });

    it('serializes multipart request correctly', function () {
      let request = {
        verb: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: {
          file: fs.createReadStream('./spec/unit/resources/fileupload_test_binary.jpg'),
          key: 'value'
        }
      };

      this.context.post('/').reply(200, function (uri, body) {
        let bb = new Busboy({headers: this.req.headers});

        let fileChecked = false;
        let fieldChecked = false;

        bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
          assert.equal(filename, 'fileupload_test_binary.jpg');
          file.on('data', (data) => {
            assert.equal(data.length, 1132);

            fileChecked = true;
          });
        });

        bb.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
          assert.equal(fieldname, 'key');
          assert.equal(val, 'value');

          fieldChecked = true;
        });

        bb.on('finish', () => {
          assert.isTrue(fileChecked);
          assert.isTrue(fieldChecked);
        });

        let stream = Buffer.from(body, 'hex');

        bb.end(stream);
      });

      return this.http.execute(request).then((resp) => {
        assert.equal(resp.statusCode, 200);
      });
    });

    it('serializes multipart/form-data request correctly', function () {
      let request = {
        verb: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: {
          file1: fs.createReadStream('./spec/unit/resources/fileupload_test_binary.jpg'),
          file2: fs.createReadStream('./spec/unit/resources/evidence.pdf'),
          input: new FormPart({
            foo: 'bar'
          }, {
            'Content-Type': 'application/json'
          })
        }
      };

      this.context.post('/').reply(200, function (uri, body) {
        let bb = new Busboy({headers: this.req.headers});
        let imageFileChecked = false;
        let pdfFileChecked = false;
        let jsonChecked = false;

        assert.match(this.req.headers['content-type'], /^multipart\/form-data; boundary=/);

        bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
          if (filename === 'fileupload_test_binary.jpg') {
            file.on('data', (data) => {
              assert.isTrue(jsonChecked); // ensure JSON is sent first

              assert.equal(mimetype, 'image/jpeg');
              assert.equal(fieldname, 'file1');
              assert.equal(data.length, 1132);

              imageFileChecked = true;
            });
          } else if (filename === 'input.json') {
            file.on('data', (data) => {
              assert.equal(mimetype, 'application/json');
              assert.equal(fieldname, 'input');
              assert.equal(data, '{"foo":"bar"}');

              jsonChecked = true;
            });
          } else if (filename === 'evidence.pdf') {
            file.on('data', (data) => {
              assert.isTrue(jsonChecked); // ensure JSON is sent first

              assert.equal(mimetype, 'application/pdf');
              assert.equal(fieldname, 'file2');
              assert.equal(data.length, 31376);

              pdfFileChecked = true;
            });
          }
        });

        bb.on('finish', () => {
          assert.isTrue(imageFileChecked);
          assert.isTrue(jsonChecked);
          assert.isTrue(pdfFileChecked);
        });

        let stream = Buffer.from(body, 'hex');

        bb.end(stream);
      });

      return this.http.execute(request).then((resp) => {
        assert.equal(resp.statusCode, 200);
      });
    });

    it('parses 200-level response', function () {
      let http = new braintreehttp.HttpClient(environment);
      let request = {
        verb: 'GET',
        path: '/'
      };

      this.context.get('/').reply(200, '{"data":1,"key":"val"}', {
        'Content-Type': 'application/json'
      });

      return http.execute(request)
        .then((resp) => {
          assert.equal(resp.statusCode, 200);
          assert.equal(resp.result.data, 1);
          assert.equal(resp.result.key, 'val');
        });
    });

    describe('gzip', function () {
      it('unzips a 200-level response', function () {
        let http = new braintreehttp.HttpClient(environment);
        let request = {
          verb: 'GET',
          path: '/'
        };

        let body = zlib.gzipSync('{"data":1,"key":"val"}');

        this.context.get('/').reply(200, body, {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip'
        });

        return http.execute(request).then((resp) => {
          assert.equal(1, resp.result.data);
          assert.equal('val', resp.result.key);
        });
      });

      it('unzips a non-200-level response', function () {
        let http = new braintreehttp.HttpClient(environment);
        let request = {
          verb: 'GET',
          path: '/'
        };

        let body = zlib.gzipSync('{"data":1,"key":"val"}');

        this.context.get('/').reply(400, body, {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip'
        });

        return http.execute(request).then((resp) => {
          assert.fail('non 200-level response should have thrown an HttpError');
        })
        .catch((err) => {
          assert.equal(err.message, '{"data":1,"key":"val"}');
        });
      });
    });

    it('rejects promise with error on non 200-level response', function () {
      let request = {
        verb: 'GET',
        path: '/'
      };

      this.context.get('/').reply(400, 'some data about this error', {
        'Content-Type': 'application/json',
        'request-id': '1234'
      });

      return this.http.execute(request)
        .then((resp) => {
          assert.fail('then shouldn\'t be called for 400 status code');
        })
        .catch((error) => {
          assert.equal(error.statusCode, 400);
          assert.equal(error.message, 'some data about this error');
          assert.equal(error.headers['request-id'], '1234');
        });
    });

    it('makes a request when only a path is specified', function () {
      let request = {
        verb: 'GET',
        path: '/some/path'
      };

      this.context.get(request.path)
        .reply(200);

      return this.http.execute(request);
    });

    it('makes a request when full url is specified', function () {
      let request = {
        verb: 'GET',
        path: 'http://some.otherhost.org/some/path'
      };
    });
  });
});
