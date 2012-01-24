var baseController = require('./app').Controller;
var map = require('./../models/map');

var Controller = function(req, res) {
  baseController.call(this, req, res);
};

routes = {
  update: function(req, res) {
    var playerId = req.authentication.playerId;
    var index = req.body.index;
    var mapId = null

    function onMapUpdated(err, doc) {
      if (doc && req.body.suspended) {
        var suspended = doc.suspendedTile ? doc.suspendedTile.compressed : null;
        var next = doc.nextTile ? doc.nextTile.compressed : null;
        res.send({suspended: suspended, next: next});
      } else if (doc && doc.complete) {
        var doc = doc.serialize;
        doc.url = '/maps/'+mapId; // show map results on completion
        res.send(doc);
      } else if (doc) {
        res.send(doc.serialize);
      } else {
        res.send({err: err || "Cannot update map"});
      }      
    }
    function onMapFound(err, doc) {
      mapId = doc ? doc._id : null;
      if (doc && req.body.suspended) {
        doc.swapSuspended(onMapUpdated);
      } else if (doc) {	
        doc.emplace(index, onMapUpdated);
      } else {
        res.send({err: err || "Map missing"});
      }	
    }
    map.Model.FindActive(playerId, onMapFound);
  },

  show: function(req, res) {
    var mapId = req.params.id;

    function onMapFound(err, doc) {
      if (doc) {
        res.render('map/show', {map: doc, layout: 'app/layouts/dialog', title: 'Arkham, MA'});
      } else {
        res.redirect('/')
      }	
	}
    map.Model.FindComplete(mapId, onMapFound);
  },

  destroy: function(req, res) {
    var playerId = req.authentication.playerId;	

    function onMapFound(err, doc) {
      if (doc) doc.remove();
      res.redirect('/');
	}
    map.Model.FindActive(playerId, onMapFound);
  }
}
Controller.prototype.Routes = routes;

module.exports = {
  Controller: Controller,
  Routes: Object.keys(Controller.prototype.Routes)
}