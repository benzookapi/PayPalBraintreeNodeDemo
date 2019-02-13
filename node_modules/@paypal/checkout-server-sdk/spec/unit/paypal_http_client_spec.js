'use strict';

const paypal = require('../../lib/lib').core;
const nock = require('nock');

describe('PayPalHttpClient', function () {
  let environment = new paypal.SandboxEnvironment('clientId', 'clientSecret');
  let env2 = new paypal.SandboxEnvironment('clientId2', 'clientSecret2');

  beforeEach(function () {
    clearToken();
    this.http = new paypal.PayPalHttpClient(environment);
    this.http2 = new paypal.PayPalHttpClient(env2);
    this.context = nock(environment.baseUrl);
    nock.cleanAll();
  });

  afterEach(() => nock.cleanAll());

  function mockAccessTokenRequest(context, options) {
    options = options || {};

    let accessTokenValue = options.refreshTokenResponse ? 'access-token-from-refresh-token' : 'simple-access-token';
    let times = options.times || 1;

    return context.post('/v1/oauth2/token').times(times).reply(200, function (uri, requestBody) {
      const token = {
        access_token: accessTokenValue,
        expires_in: options.expiresIn || 3600,
        token_type: 'Bearer'
      };
      if (options.refreshTokenValue) {
        token.refresh_token = options.refreshTokenValue;
      }
      return token;
    }, {
      'Content-Type': 'application/json'
    });
  }

  function clearToken() {
    const client = paypal.TokenCache.cacheForEnvironment(environment);
    client.setToken(null);
  }

  function createToken(expired, refresh) {
    const token = new paypal.AccessToken({
      access_token: 'simple-access-token',
      expires_in: expired ? 0 : 3600,
      token_type: 'Bearer',
    });
    token._dateCreated = Date.now() - (expired ? 360000 : 0);
    if (refresh) {
      token.refresh_token = 'refresh-token';
    }
    return token;
  }

  function authHeader(refresh) {
    return {
      reqheaders: {
        authorization: refresh ? 'Bearer access-token-from-refresh-token' : 'Bearer simple-access-token'
      }
    }
  }

  describe('user agent', function () {
    it('returns properly formatted user agent', function () {
      let version = require('../../package').version;
      expect(this.http.getUserAgent()).to.include('PayPalSDK/PayPal-node-SDK ' + version);
      expect(this.http.getUserAgent()).to.include('OpenSSL');
      expect(this.http.getUserAgent()).to.include('node');
    });
  });

  describe('execute', function () {
    const authTokenHeader = authHeader(false);
    const authRefreshHeader = authHeader(true);

    it('fetches access token if not yet fetched', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };

      let requestNock = nock(environment.baseUrl, authTokenHeader).get('/').reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      let accessTokenNock = mockAccessTokenRequest(this.context);

      return this.http.execute(request).then((resp) => {
        expect(resp.result.some_data).to.equal('some_value');
        expect(requestNock.isDone()).to.be.true();
        expect(accessTokenNock.isDone()).to.be.true();
      });
    });

    it('does not fetch access token if authorization header is already set on request', function () {
      let request = {
        path: '/',
        verb: 'GET',
        headers: {
          Authorization: 'custom authorization header'
        }
      };

      let expectedHeader = {
        reqheaders: {
          authorization: 'custom authorization header'
        }
      };

      let requestNock = nock(environment.baseUrl, expectedHeader).get('/').times(1).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      expect(this.http._cache.getToken()).to.not.exist();
      return this.http.execute(request).then((resp) => {
        let customToken = this.http._cache.getToken();
        expect(customToken).to.not.exist();
        expect(requestNock.isDone()).to.be.true();
        expect(resp.result.some_data).to.equal('some_value');
      });
    });

    it('does not fetch access token if not expired and still valid', function () {
      let prevToken;
      let request = {
        path: '/',
        verb: 'GET'
      };

      let requestNock = nock(environment.baseUrl, authTokenHeader).get('/').times(2).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      let accessTokenNock = mockAccessTokenRequest(this.context, {times: 1});

      return this.http.execute(request).then((resp) => {
        expect(resp.result.some_data).to.equal('some_value');
        return this.http.execute(request).then((resp) => {
          expect(resp.result.some_data).to.equal('some_value');
          expect(requestNock.isDone()).to.be.true();
          expect(accessTokenNock.isDone()).to.be.true();
        });
      });
    });

    it('fetches an access token if expired without refresh token', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };

      let requestNock = nock(environment.baseUrl, authTokenHeader).get('/').times(2).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      let accessTokenNock = mockAccessTokenRequest(this.context, {
        expiresIn: -1,
        times: 2
      });

      return this.http.execute(request).then(() => {
        return this.http.execute(request).then(() => {
          expect(accessTokenNock.isDone()).to.be.true();
        });
      });
    });

    it('fetches a new access token using a refresh token if expired', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };

      let requestNock = nock(environment.baseUrl, authRefreshHeader).get('/').times(2).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      let refreshTokenNock = mockAccessTokenRequest(this.context, {
        times: 2,
        refreshTokenResponse: true,
        refreshTokenValue: 'refresh-token'
      });

      return this.http.execute(request).then(() => {
        this.http.execute(request).then(() => {
          expect(refreshTokenNock.isDone()).to.be.true();
          expect(requestNock.isDone()).to.be.true();
        });
      });
    });

    it('synchronizes access token requests for the same client', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };

      let requestNock = nock(environment.baseUrl, authTokenHeader).get('/').times(2).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      let accessTokenNock = mockAccessTokenRequest(this.context, {times: 1});

      return Promise.all([
        this.http.execute(request),
        this.http.execute(request),
      ]).then((values) => {
        expect(requestNock.isDone()).to.be.true();
        expect(accessTokenNock.isDone()).to.be.true();
      })
    });

    it('synchronizes access token requests for clients with the same credentials', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };
      let requestNock = nock(environment.baseUrl, authTokenHeader).get('/').times(2).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });
      let accessTokenNock = mockAccessTokenRequest(this.context, {times: 1});

      let otherHttp = new paypal.PayPalHttpClient(environment);

      return Promise.all([
        this.http.execute(request),
        otherHttp.execute(request),
      ]).then((values) => {
        expect(requestNock.isDone()).to.be.true();
        expect(accessTokenNock.isDone()).to.be.true();
      })
    });

    it('does not synchronize access token requests for clients with different credentials', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };

      let successfulRequestNock = nock(environment.baseUrl, authTokenHeader).get('/').times(2).reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });
      let accessTokenNock = mockAccessTokenRequest(this.context, {times: 2});

      return Promise.all([
        this.http.execute(request),
        this.http2.execute(request),
      ]).then((values) => {
        expect(successfulRequestNock.isDone()).to.be.true();
        expect(accessTokenNock.isDone()).to.be.true();
      });
    });

    it('retries calls on authorization errors', function () {
      let request = {
        verb: 'GET',
        path: '/',
      };

      let accessTokenNock = mockAccessTokenRequest(this.context, {times: 2});
      let rejectionNock = this.context.get('/').times(2).reply(401);
      let requestNock = this.context.get('/').times(2).reply(200, () => JSON.stringify({some_data: 'some_value'}), {
        'Content-Type': 'application/json'
      });

      return Promise.all([
        this.http.execute(request),
        this.http.execute(request)
      ]).then((results) => {
        expect(accessTokenNock.isDone()).to.be.true();
        expect(rejectionNock.isDone()).to.be.true();
        expect(requestNock.isDone()).to.be.true();
        results.forEach((res) => {
          expect(res.result.some_data).to.equal('some_value');
        });
      });
    });

    it('retries authorization calls on 401 errors only once', function () {
      this.context.post('/v1/oauth2/token').times(2).reply(function (uri, requestBody) {
        return [
          401,
          'there was an error fetching your access token',
          {}
        ];
      });

      let request = {
        verb: 'GET',
        path: '/',
      };

      let requestNock = this.context.get('/').times(1).reply(200);

      return this.http.execute(request).then((res) => {
        expect().fail('should have failed with 401 error');
      }).catch((err) => {
        expect(requestNock.isDone()).to.be.false();
        expect(requestNock.pendingMocks()).to.have.length(1);
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal('there was an error fetching your access token');
      })
    });

    it('sets Accept-Encoding header to gzip', function () {
      let request = {
        path: '/',
        verb: 'GET'
      };

      let requestNock = nock(environment.baseUrl, {
        reqheaders: {
          'accept-encoding': 'gzip'
        }
      }).get('/').reply(200, function (uri, body) {
        return JSON.stringify({some_data: 'some_value'});
      }, {
        'Content-Type': 'application/json'
      });

      let accessTokenNock = mockAccessTokenRequest(this.context);

      expect(this.http.accessToken).to.not.exist();
      return this.http.execute(request).then((resp) => {
        expect(resp.result.some_data).to.equal('some_value');
        expect(requestNock.isDone()).to.be.true();
        expect(accessTokenNock.isDone()).to.be.true();
      });
    });
  });

});
