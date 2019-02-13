'use strict';

let zlib = require('zlib');

class Encoder {

  constructor(encoders) {
    this._encoders = encoders;
  }

  serializeRequest(request) {
    let contentType = request.headers['content-type'] || request.headers['Content-Type'];

    if (!contentType) {
      throw new Error('HttpRequest does not have Content-Type header set');
    }

    let encoder = this._encoder(contentType);

    if (!encoder) {
      throw new Error(`Unable to serialize request with Content-Type ${contentType}. Supported encodings are ${this.supportedEncodings()}`);
    }

    let contentEncoding = request.headers['content-encoding'] || request.headers['Content-Encoding'];
    let encoded = encoder.encode(request);

    if (contentEncoding === 'gzip') {
      return zlib.gzipSync(encoded);
    }

    return encoded;
  }

  deserializeResponse(responseBody, headers) {
    let contentType = headers['content-type'] || headers['Content-Type'];

    if (!contentType) {
      throw new Error('HttpRequest does not have Content-Type header set');
    }

    let encoder = this._encoder(contentType);

    if (!encoder) {
      throw new Error(`Unable to deserialize response with Content-Type ${contentType}. Supported decodings are ${this.supportedEncodings()}`);
    }

    return encoder.decode(responseBody);
  }

  supportedEncodings() {
    return '[' + this._encoders.map(e => e.contentType().toString()).join(', ') + ']';
  }

  _encoder(contentType) {
    for (let i = 0; i < this._encoders.length; i++) {
      let enc = this._encoders[i];

      if (enc.contentType().test(contentType)) {
        return enc;
      }
    }

    return null;
  }
}

module.exports = {Encoder: Encoder};
