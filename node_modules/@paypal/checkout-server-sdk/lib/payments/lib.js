'use strict';
/* eslint-disable comma-dangle*/

module.exports = {
  AuthorizationsCaptureRequest: require('./authorizationsCaptureRequest').AuthorizationsCaptureRequest,
  AuthorizationsGetRequest: require('./authorizationsGetRequest').AuthorizationsGetRequest,
  AuthorizationsReauthorizeRequest: require('./authorizationsReauthorizeRequest').AuthorizationsReauthorizeRequest,
  AuthorizationsVoidRequest: require('./authorizationsVoidRequest').AuthorizationsVoidRequest,
  CapturesGetRequest: require('./capturesGetRequest').CapturesGetRequest,
  CapturesRefundRequest: require('./capturesRefundRequest').CapturesRefundRequest,
  RefundsGetRequest: require('./refundsGetRequest').RefundsGetRequest,
};
