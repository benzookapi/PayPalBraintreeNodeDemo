'use strict';

const EventEmitter = require('events').EventEmitter;

const _cacheMap = {};

/**
 * Stores token, token status and a request queue for every client
 */
class TokenCache {

  static cacheForEnvironment(environment, refreshToken) {
    let key = environment.clientId;

    if (refreshToken) {
      key += `_${refreshToken}`;
    }

    if (!_cacheMap[key]) {
      _cacheMap[key] = new TokenCache();
    }

    return _cacheMap[key];
  }

  constructor() {
    this._token = null;
    this._locked = false;
    this._requests = [];
    this._emitter = new EventEmitter();
    this._emitter.setMaxListeners(0);
  }

  /**
   * Gets the current token for the client
   * @return {AccessToken|null} - The current token or null if there is none
   */
  getToken() {
    return this._token;
  }

  /**
   * Sets the token for the current client also setting its status to absent or valid if the token exist or not
   * @param {AccessToken|null} token - The current token for the client or null to remove it
   * @return {void}
   */
  setToken(token) {
    this._token = token;
  }

  lock() {
    this._locked = true;
  }

  unlock() {
    this._locked = false;
  }

  isLocked() {
    return this._locked;
  }

  isValid() {
    return this.isPresent() && !this._token.isExpired();
  }

  isPresent() {
    return Boolean(this._token);
  }

  /**
   * Add a request to the queue and wait for the notify method to signal error or completion
   * @param {Object} request - The request to be queued
   * @return {Promise} - A promise that will resolve or rejects when the notify method is called
   * */
  wait(request) {
    this._requests.push(request);
    return new Promise((resolve, reject) => {
      const completeHandler = (req) => {
        if (request === req) {
          this._emitter.removeListener('complete', completeHandler);
          resolve(request);
        }
      };
      const failHandler = (err) => {
        this._emitter.removeListener('fail', failHandler);
        reject(err);
      };

      this._emitter.on('complete', completeHandler);
      this._emitter.on('fail', failHandler);
    });
  }

  /**
   * Flush the request queue resolving every call in the order they were added or rejects all calls if an error is provided
   * @param {Array} [err] - An optional error that rejects all requests instead of resolving them
   * @return {void} - void
   */
  notify(err) {
    if (err) {
      this._emitter.emit('fail', err);
    } else {
      this._requests.forEach(request => this._emitter.emit('complete', request));
    }
    this._requests = [];
    this._emitter.removeAllListeners();
  }
}

module.exports = {TokenCache: TokenCache};
