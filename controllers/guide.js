var baseController = require('./app').Controller;

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  index: function(req, res) {
    var opts = {title: 'Arkham Triune Game Guide'};
    res.render('guide/index', opts)
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}