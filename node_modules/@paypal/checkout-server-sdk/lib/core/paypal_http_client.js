'use strict';
/* eslint-disable no-invalid-this,consistent-return*/

const braintreehttp = require('braintreehttp');
const AccessToken = require('./access_token').AccessToken;
const AccessTokenRequest = require('./access_token_request').AccessTokenRequest;
const sdkVersion = require('../../package').version;
const TokenCache = require('./token_cache').TokenCache;

/**
 * PayPal Http client
 */
class PayPalHttpClient extends braintreehttp.HttpClient {

  /**
   * @param {PayPalEnvironment} environment - The environment for this client
   * @param {string} refreshToken - The refreshToken to be used to generate the access Token.
   */
  constructor(environment, refreshToken) {
    super(environment);

    this._cache = TokenCache.cacheForEnvironment(environment, refreshToken);
    this.refreshToken = refreshToken;
    this.addInjector(authInjector.bind(this));
    this.addInjector(function (req) {
      req.headers['Accept-Encoding'] = 'gzip';
      req.headers["sdk_name"] = "Checkout SDK";
      req.headers["sdk_version"] = "2.0.0-rc2";
      req.headers["sdk_tech_stack"] = "NodeJS " + process.version;
      req.headers["api_integration_type"] = "PAYPALSDK";
    });
  }

  /**
   * Returns the user agent for this client implementation
   * @override
   * @return {string} - The user agent string
   */
  getUserAgent() {
    return 'PayPalSDK/PayPal-node-SDK ' + sdkVersion + ' (node ' + process.version + '-' + process.arch + '-' + process.platform + '; OpenSSL ' + process.versions.openssl + ')';
  }

  execute(request) {
    return super.execute(request).catch((err) => {
      if (err.statusCode === 401) {
        return this._retryRequest(request);
      }
      return Promise.reject(err);
    });
  }

  _retryRequest(request) {
    const promise = this._cache.wait(request).then(() => {
      this._setAuthHeader(request);
      return super.execute(request);
    });

    if (this._cache.isLocked()) {
      return promise;
    }

    // Avoids node UnhandledPromiseRejectionWarning on access token failure.
    return Promise.race([this.fetchAccessToken(), promise]).then(() => promise);
  }

  fetchAccessToken() {
    this._cache.lock();
    return super.execute(new AccessTokenRequest(this.environment, this.refreshToken)).then((resp) => {
      const token = new AccessToken(resp.result);

      this._cache.setToken(token);
      this._cache.notify();
      this._cache.unlock();
      return token;
    }).catch((err) => {
      this._cache.setToken(null);
      this._cache.notify(err);
      this._cache.unlock();
      return Promise.reject(err);
    });
  }

  /**
   * Sets the Authorization header for this request based on the client token
   * @param {Object} request - The request to modify
   * @private
   * @return {void}
   */
  _setAuthHeader(request) {
    const token = this._cache.getToken();

    request.headers = request.headers || {};
    request.headers.Authorization = token.authorizationString();
  }
}

/**
 * An injector that fetches token when the client has no token or is expired and queues calls if the token is refreshing
 * @param {Object} request - The current request for the client
 * @return {Promise.<any>} Promise that fetches a new access Token
 */
function authInjector(request) {
  if (request.headers.Authorization) {
    return;
  }

  if (this._cache.isValid()) {
    this._setAuthHeader(request);
  } else if (this._cache.isLocked()) {
    return this._cache.wait(request).then(() => this._setAuthHeader(request));
  } else if (!this._cache.isValid()) {
    return Promise.all([
      this._cache.wait(request),
      this.fetchAccessToken()
    ]).then(() => this._setAuthHeader(request));
  }
}

module.exports = {
  PayPalHttpClient: PayPalHttpClient
};
