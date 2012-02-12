var baseController = require('./app').Controller;
var Player = require('./../models/player').Model;
var Payment = require('./../models/payment').Model;
var client = require('../lib/facebook/client');
var item = require('./../models/item');

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  index: function(req, res) {
    var playerId = req.authentication.playerId;

    Player.Find(playerId, function(err, doc) {
      var opts = {layout: 'app/layouts/dialog', title: 'Starry Wisdom Bazaar'};
      opts.items = item.Model.categories;
      opts.wisdom = doc ? doc.wisdom : 0;
      res.render('item/index', opts);
    })
  },

  show: function(req, res) {
    var playerId = req.authentication.playerId;
    var itemId = req.params.id;

    item.Model.findOne({_id: itemId}, function(err, doc) {
      if (doc && doc.premium) {
        Payment.Create(playerId, itemId, function(err, pay) {
          var fb = new client();
          var opts = {PayDialogUrl: fb.getPayDialogUrl(pay), layout: 'app/layouts/blank'};
          res.render('facebook/pay', opts);
        })
      } else if (doc) {
        item.Model.Purchase(playerId, itemId, function(err, doc) {
          res.redirect('/')
        })
      } else {
        res.redirect('/')
      }
    });
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}