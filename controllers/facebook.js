var baseController = require('./app').Controller;

var FacebookRequest = function(req) {
  this.error = req.params.access_denied;
  this.error_description = req.params.error_description;
  this.code = req.params.code;
}
FacebookRequest.prototype.hasError = function hasError() {
  return this.error ? true : false;
}

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  create: function(req, res) {
    var fbr = new FacebookRequest(req);

  }
}

Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}