'use strict';

let braintreehttp = require('../../lib/braintreehttp');
let fs = require('fs');
let zlib = require('zlib');
let Json = require('../../lib/braintreehttp/serializer/json').Json;
let Text = require('../../lib/braintreehttp/serializer/text').Text;
let Multipart = require('../../lib/braintreehttp/serializer/multipart').Multipart;
let FormEncoded = require('../../lib/braintreehttp/serializer/form_encoded').FormEncoded;

describe('encoder', function () {
  let encoder = new braintreehttp.Encoder([new Json(), new Text(), new Multipart(), new FormEncoded()]);

  describe('serializeRequest', function () {
    it('throws when content-type not supported', function () {
      let req = {
        headers: {
          'Content-Type': 'not application/json'
        },
        body: {
          one: 'two',
          three: ['one', 'two', 'three']
        }
      };

      assert.throws(() => encoder.serializeRequest(req), Error, 'Unable to serialize request with Content-Type not application/json. Supported encodings are ');
    });

    it('throws when content-type header not present', function () {
      let req = {
        headers: {
          'User-Agent': 'some user agent'
        },
        body: {
          one: 'two',
          three: ['one', 'two', 'three']
        }
      };

      assert.throws(() => encoder.serializeRequest(req), Error, 'HttpRequest does not have Content-Type header set');
    });

    it('serializes a request with content-type == application/json', function () {
      let req = {
        headers: {
          'Content-Type': 'application/json; charset=utf8'
        },
        body: {
          one: 'two',
          three: ['one', 'two', 'three']
        }
      };

      assert.equal(encoder.serializeRequest(req), '{"one":"two","three":["one","two","three"]}');
    });

    it('serializes a request with content-type == text/*', function () {
      let req = {
        headers: {
          'Content-Type': 'text/asdf; charset=utf8'
        },
        body: 'some asdf text'
      };

      assert.equal(encoder.serializeRequest(req), 'some asdf text');
    });

    it('serializes a request with content-type multipart/*', function () {
      let fp = './spec/unit/resources/fileupload_test_binary.jpg';

      let request = {
        verb: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'multipart/form-data; charset=utf8'
        },
        body: {
          file: fs.createReadStream(fp),
          key: 'value'
        }
      };

      let encoded = encoder.serializeRequest(request);

      assert.include(request.headers['content-type'], 'multipart/form-data; boundary=boundary');

      let filedata = fs.readFileSync(fp);

      assert.include(encoded, 'Content-Disposition: form-data; name="file"; filename="fileupload_test_binary.jpg"\r\nContent-Type: image/jpeg');
      assert.include(encoded, filedata);
      assert.include(encoded, 'Content-Disposition: form-data; name="key"');
      assert.include(encoded, 'value');
    });

    it('serializes a request with content-type == application/x-www-form-urlencoded', function () {
      let request = {
        verb: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf8'
        },
        body: {
          key: 'value',
          anotherkey: 'anothervalue with spaces'
        }
      };

      let encoded = encoder.serializeRequest(request);

      assert.equal(encoded, 'key=value&anotherkey=anothervalue%20with%20spaces');
    });

    it('gzips data when content-encoding === gzip', function () {
      let request = {
        verb: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Content-Encoding': 'gzip'
        },
        body: {
          key: 'value',
          anotherkey: 'anothervalue with spaces'
        }
      };

      let encoded = encoder.serializeRequest(request);
      let expected = zlib.gzipSync(JSON.stringify(request.body));

      assert.equal(encoded.toString('hex'), expected.toString('hex'));
    });
  });

  describe('deserializeResponse', function () {
    it('deserializes a response with content-type == application/json', function () {
      let headers = {
        'content-type': 'application/json; charset=utf8'
      };
      let body = '{"one":"two","three":["one","two","three"]}';
      let deserialized = encoder.deserializeResponse(body, headers);

      assert.equal(deserialized.one, 'two');
      assert.deepEqual(deserialized.three, ['one', 'two', 'three']);
    });

    it('deserializes a response with content-type == text/*', function () {
      let headers = {
        'content-type': 'text/asdf; charset=utf8'
      };
      let body = 'some asdf text';

      assert.equal(encoder.deserializeResponse(body, headers), body);
    });

    it('throws when response content-type == multipart/*', function () {
      let headers = {
        'content-type': 'multipart/form-data; charset=utf8'
      };

      let body = 'some form data';

      assert.throws(() => encoder.deserializeResponse(body, headers), Error, 'Multipart does not support deserialization.');
    });

    it('throws when response content-type == application/x-www-form-urlencoded', function () {
      let headers = {
        'content-type': 'application/x-www-form-urlencoded; charset=utf8'
      };

      let body = {keyOne: 'valOne'};

      assert.throws(() => encoder.deserializeResponse(body, headers), Error, 'FormEncoded does not support deserialization');
    });

    it('throws when content-type not supported', function () {
      let headers = {
        'content-type': 'not application/json; charset=utf8'
      };
      let body = '{"one":"two","three":["one","two","three"]}';

      assert.throws(() => encoder.deserializeResponse(body, headers), Error, 'Unable to deserialize response with Content-Type not application/json; charset=utf8. Supported decodings ');
    });
  });
});
