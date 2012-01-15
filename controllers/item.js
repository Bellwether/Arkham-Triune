var baseController = require('./app').Controller;
var Player = require('./../models/player').Model;
var item = require('./../models/item');

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  index: function(req, res) {
    var playerId = req.authentication.playerId;

    var player = Player.Find(playerId, function(err, doc) {
      var opts = {layout: 'app/layouts/dialog', title: 'Starry Wisdom Bazaar'};
      opts.items = item.Model.list;
      opts.wisdom = doc ? doc.wisdom : 0;
      res.render('item/index', opts);
    })
  },

  show: function(req, res) {
    var playerId = req.authentication.playerId;
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}