var baseController = require('./app').Controller;
var client = require('../lib/facebook/client');

var FacebookAPIRequest = function(req) {
  this.error = req.params.access_denied;
  this.error_description = req.params.error_description;
  this.code = req.params.code;
}
FacebookAPIRequest.prototype.hasError = function hasError() {
  return this.error ? true : false;
}
FacebookAPIRequest.prototype.isAuthenticating = function isAuthenticating() {
  return this.code ? true : false;
}

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

function authenticateUser(fbr) {
  var fb = new client();
  var code = fbr.code;

  fb.requestAccessToken(fbr.code, function(err, data) {
    console.log("requestAccessToken() "+err+' '+JSON.stringify(data));
  });	
}

routes = {
  index: function(req, res) {
    var fbr = new FacebookAPIRequest(req);

    if (fbr.isAuthenticating()) {
      authenticateUser(fbr);
    } else if (fbr.hasError()) {
      res.render('facebook/index', {errorDescription: fbr.error_description});
    } else {
      res.render('facebook/index');
    };
  },
	
  new: function(req, res) {
    var fb = new client();
    var stateToken = req.session.id;
    var opts = {OAuthDialogUrl: fb.getOAuthDialogUrl(stateToken), layout: 'app/layouts/blank'};
    res.render('facebook/new', opts);
  }
}

Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}