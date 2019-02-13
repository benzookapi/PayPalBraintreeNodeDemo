'use strict';
/* eslint-disable camelcase*/

/**
 * An OAuth2 refresh token request, granted from user consent.
 */
class RefreshTokenRequest {

  /**
   * @param {PayPalEnvironment} environment - The environment for this request (sandbox or live)
   * @param {string} code - The authorization code provided at the end of the user consent OAuth flow.
   */
  constructor(environment, code) {
    let body = {
      grant_type: 'authorization_code',
      code: code
    };

    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: environment.authorizationString()
    };

    this.path = '/v1/identity/openidconnect/tokenservice';
    this.body = body;
    this.verb = 'POST';
  }
}

module.exports = {
  RefreshTokenRequest: RefreshTokenRequest
};
