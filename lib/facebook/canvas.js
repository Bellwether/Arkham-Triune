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

var Signature = function(params) {	
  this.signedRequest = params['signed_request'];
  this.authenticated = false;
  this.authorized = false;

  if (this.signedRequest) {
    this.init();
    this.authenticate();
    this.authorize();
  }
}
Signature.prototype.init = function init() {
  this.signatureParts = this.signedRequest.split('.', 2);
  this.encodedSignature = this.signatureParts[0];
  this.payload = this.signatureParts[1];	
  this.decodePayload();
}
Signature.prototype.decodePayload = function decodePayload() {
  log("config.appSecret="+config.appSecret+", this.payload="+this.payload)	
  var data = crypto.createHmac('sha256', config.appSecret).update(this.payload).digest('base64');
  this.selfEncodedSignature = data.replace(/\+/g,'-').replace(/\//g,'_').replace('=','');
}
Signature.prototype.isValidSignature = function isValidSignature() {
  return this.encodedSignature === this.selfEncodedSignature;
}
Signature.prototype.isValidAlgorithm = function isValidAlgorithm() {
  return this.params && this.params.algorithm === 'HMAC-SHA256' ? true : false;
}
Signature.prototype.authenticate = function authenticate() {
  try {
    var signedData = base64.urlDecode(this.payload);
    this.params = JSON.parse(signedData);

    log("authenticate signedData "+JSON.stringify(signedData))

    if (!this.isValidAlgorithm()) { 
	  throw 'unknown algorithm used to decode signed request: ' + JSON.stringify(this.params);
	} else if (!this.isValidSignature()) {
      log('signature has been tainted: "' + this.signedRequest + '" does not match expected "' + this.selfEncodedSignature + '"')
	  throw 'signature has been tainted: "' + this.signedRequest + '" does not match expected "' + this.selfEncodedSignature + '"';
	} else {
      this.authenticated = true;
	}
	
  } catch(err) {
    this.params = {};
    log("ERROR in CanvasRequest: "+err)
    return;
  }
}
Signature.prototype.authorize = function authorize() {
  this.authorized = this.params.oauth_token ? true : false;
}

var CanvasRequest = function(req) {
  this.params = req.body || req.query || {};
  this.signature = new Signature(this.params);

  return {
    params: this.signature.params,
    authenticated: this.signature.authenticated,
    authorized: this.signature.authorized
  }
}

exports.init = function (app) {	
  app.use(function (req, res, next) {
    var canvas = new CanvasRequest(req);
    if (canvas.authenticated) {
      log("authenticated canvas params: "+JSON.stringify(canvas.params))
      req.canvas = canvas;
    }
    next();
  });
};