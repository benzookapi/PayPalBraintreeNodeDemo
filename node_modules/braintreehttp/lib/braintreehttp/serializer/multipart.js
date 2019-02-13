'use strict';

let fs = require('fs');
let path = require('path');
let Encoder = require('../encoder').Encoder;
let Json = require('./json').Json;
let Text = require('./text').Text;
let FormEncoded = require('./form_encoded').FormEncoded;

class FormPart {
  constructor(value, headers) {
    this.headers = {};
    this.value = value;

    Object.keys(headers).forEach((key) => {
      // downcase, split into words, title case words, join into 'Header-Case'
      this.headers[key.toLowerCase().split('-').map((word) => { return word[0].toUpperCase() + word.slice(1); }).join('-')] = headers[key];
    });
  }
}

class Multipart {
  static get _CRLF() {
    return '\r\n';
  }

  encode(request) {
    let buffers = null;
    let fileBuffers = [];
    let valueBuffers = [];
    let boundary = 'boundary' + Date.now();

    request.headers['Content-Type'] += `; boundary=${boundary}`;

    for (const key of Object.keys(request.body)) {
      let val = request.body[key];

      if (val instanceof fs.ReadStream) {
        fileBuffers.push(this._filePart(key, val, boundary, request));
      } else {
        valueBuffers.push(this._formPart(key, val, boundary, request));
      }
    }

    buffers = valueBuffers.concat(fileBuffers);

    buffers.push(Buffer.from(`--${boundary}--`));
    buffers.push(Buffer.from(Multipart._CRLF));
    buffers.push(Buffer.from(Multipart._CRLF));

    return Buffer.concat(buffers);
  }

  decode() {
    throw new Error('Multipart does not support deserialization.');
  }

  contentType() {
    return /^multipart\/.*/;
  }

  _filePart(key, readStream, boundary, request) {
    return Buffer.concat([
      Buffer.from(this._partHeader(key, path.basename(readStream.path), boundary, request)),
      fs.readFileSync(readStream.path),
      Buffer.from(Multipart._CRLF)
    ]);
  }

  _formPart(key, formPart, boundary, request) {
    let formPartContentType = null;
    let formPartValue = null;
    let contentBuffer = null;
    let encoder = new Encoder([new Json(), new Text(), new FormEncoded()]);

    if (formPart instanceof FormPart) {
      formPartContentType = formPart.headers['Content-Type'];
      formPartValue = formPart.value;
    }

    if (formPartContentType) {
      let body = encoder.serializeRequest({
        body: formPartValue,
        headers: formPart.headers
      });

      contentBuffer = Buffer.from(body + Multipart._CRLF);
    } else {
      contentBuffer = Buffer.from(formPart + Multipart._CRLF);
    }

    return Buffer.concat([
      Buffer.from(this._partHeader(key, null, boundary, request)),
      contentBuffer
    ]);
  }

  _partHeader(key, filename, boundary, request) {
    let formPart = request.body[key];
    let part = `--${boundary}`;

    part += Multipart._CRLF;
    part += `Content-Disposition: form-data; name="${key}"`;

    if (filename) {
      part += `; filename="${filename}"`;
      part += Multipart._CRLF;
      part += `Content-Type: ${this._filetype(filename)}`;
    }

    if (formPart instanceof FormPart) {
      let partHeaders = formPart.headers;

      if (partHeaders['Content-Type'] === 'application/json') {
        part += `; filename="${key}.json"`;
      }

      for (const headerKey of Object.keys(partHeaders)) {
        part += Multipart._CRLF;
        part += headerKey + ': ' + partHeaders[headerKey];
      }
    }

    part += `${Multipart._CRLF}${Multipart._CRLF}`;

    return part;
  }

  _filetype(filename) {
    let ext = path.extname(filename);

    if (ext === '.jpeg' || ext === '.jpg') {
      return 'image/jpeg';
    } else if (ext === '.png') {
      return 'image/png';
    } else if (ext === '.gif') {
      return 'image/gif';
    } else if (ext === '.pdf') {
      return 'application/pdf';
    }

    return 'application/octet-stream';
  }
}

module.exports = {
  Multipart: Multipart,
  FormPart: FormPart
};
