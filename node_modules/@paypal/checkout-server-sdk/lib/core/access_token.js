'use strict';

/**
 * A small amount of time to loosen the token expiration algorithm
 * @constant EXPIRATION_THRESHOLD
 * @type {number}
 */
const EXPIRATION_THRESHOLD = 500;

/**
 * An OAuth2 access token
 */
class AccessToken {
  /**
   * @param {object} options - The access token object as it was granted by the token endpoint
   * @param {string} options.access_token - The access token
   * @param {string} options.token_type - The token type
   * @param {number} options.expires_in - The duration of the token in milliseconds
   * @param {string} options.refresh_token - The refresh token if any to refresh the current token
   */
  constructor(options) {
    this._accessToken = options.access_token;
    this._tokenType = options.token_type;
    this._expiresIn = options.expires_in * 1000;
    this._dateCreated = Date.now();
  }

  /**
   * Get the expiration status of the token
   * @return {boolean} - True if the token is expired otherwise false
   */
  isExpired() {
    return Date.now() > this._dateCreated + this._expiresIn - EXPIRATION_THRESHOLD;
  }

  /**
   * Get the value of an Authorization header with the current access token
   * @return {string} - The Authorization header value
   */
  authorizationString() {
    return `${this._tokenType} ${this._accessToken}`;
  }
}

module.exports = {
  AccessToken: AccessToken
};
