var baseController = require('./app').Controller;
var Leaderboard = require('./../models/leaderboard').Model;

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  index: function(req, res) {
    var highScores = [];
    var moves = [];
    Leaderboard.Find(function(err, docs) {
      var opts = {title: 'Census Bureau Leaderboards', leaderboards: docs};
      res.render('leaderboard/index', opts)
      
    })
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}