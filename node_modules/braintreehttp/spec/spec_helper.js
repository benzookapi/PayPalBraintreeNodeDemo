'use strict';
/* eslint-disable func-style, no-console */

let chai = require('chai');

chai.Assertion.includeStack = true;

global.assert = chai.assert;

global.assert.isEmptyArray = function (array) {
  assert.isArray(array);
  assert.equal(array.length, 0);
};

global.inspect = object => console.dir(object);
