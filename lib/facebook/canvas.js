var crypto = require('crypto');
var log = require('util').log;
var config = require('./config');

var base64 = {
  encode: function (unencoded) {
    return new Buffer(unencoded || '').toString('base64');
  },
  decode: function (encoded) {
    return new Buffer(encoded || '', 'base64').toString('utf8');
  },
  urlDecode: function(encoded) {
    var encoded = (encoded || '').replace('-','+').replace('_','/');
    for (var idx = 0; idx < (4 - (encoded.length % 4)); idx++) encoded = encoded + '=';
    return base64.decode(encoded);
  }
};

var CanvasRequest = function(req) {
  this.params = req.body || req.query || {};
  this.signedRequest = params['signed_request'];

  if (this.isSigned()) {
    this.setSignature();
    this.authenticate();
  }
}
CanvasRequest.prototype.isValidAlgorithm = function isValidAlgorithm() {
  return this.jsonData && jsonData.algorithm === 'HMAC-SHA256' ? true : false;
}
CanvasRequest.prototype.isSigned = function isSigned() {
  return this.signedRequest !== undefined && this.signedRequest.length > 0;	
}
CanvasRequest.prototype.isValidSignature = function isValidSignature() {
  return this.encodedSignature === this.selfEncodedSignature;
}
CanvasRequest.prototype.setSignature = function setSignature() {
  this.signatureParts = this.signedRequest.split('.', 2);
  this.encodedSignature = this.signatureParts[0];
  this.payload = this.signatureParts[1];
}
CanvasRequest.prototype.authenticate = function authenticate() {
  try {
    var signedData = base64.urlDecode(this.payload);
    this.jsonData = JSON.parse(signedData);

    if (this.isValidAlgorithm()) { 
      this.signPayload();
    } else {
	  throw 'unknown algorithm used to decode signed request: ' + this.jsonData.algorithm;
	}
  } catch(err) {
    log("ERROR in CanvasRequest: "+err)
    return;
  }
}
CanvasRequest.prototype.signPayload = function signPayload() {
  var data = crypto.createHmac('sha256', config.appSecret).update(this.payload).digest('base64');
  this.selfEncodedSignature = data.replace(/\+/g,'-').replace(/\//g,'_').replace('=','');
}

exports.init = function (app) {
  app.use(function (req, res, next) {
    var canvas = new CanvasRequest(req);
    if (canvas.isSigned()) {
    } else {
    }
    next();
  });
};