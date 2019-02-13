'use strict';

class Text {
  encode(request) {
    if (typeof request.body === 'string') {
      return request.body;
    }
    return request.body.toString();
  }

  decode(body) {
    if (typeof body === 'string') {
      return body;
    }
    return body.toString();
  }

  contentType() {
    return /^text\/.*/;
  }
}

module.exports.Text = Text;
