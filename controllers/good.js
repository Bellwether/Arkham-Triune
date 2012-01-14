var baseController = require('./app').Controller;
var map = require('./../models/map');

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  index: function(req, res) {
    res.render('good/index', {layout: 'app/layouts/dialog'});
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}	