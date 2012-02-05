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

routes = {
  new: function(req, res) {
  },

  create: function(req, res) {
    var fbr = new FacebookAPIRequest(req);

  }
}

Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}