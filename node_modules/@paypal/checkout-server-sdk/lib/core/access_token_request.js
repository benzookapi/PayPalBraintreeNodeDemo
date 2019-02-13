'use strict';
/* eslint-disable camelcase*/
/**
 * An OAuth2 client credentials grant access token request
 */
class AccessTokenRequest {

  /**
   * @param {PayPalEnvironment} environment - The environment for this request (sandbox or live)
   * @param {string} [refreshToken] - An optional refresh token to use refreshing instead of granting
   */
  constructor(environment, refreshToken) {
    let body = {
      grant_type: 'client_credentials'
    };

    if (refreshToken) {
      body = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      };
    }

    this.path = '/v1/oauth2/token';
    this.body = body;
    this.verb = 'POST';
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: environment.authorizationString()
    };
  }
}

module.exports = {
  AccessTokenRequest: AccessTokenRequest
};
