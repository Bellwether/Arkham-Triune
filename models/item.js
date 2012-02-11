var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Player = require('./player').Model;
var Map = require('./map').Model;
var Tile = require('./tile').Model;

var facebookItem = {
  title: String,
  description: String,
  price: Number,
  item_id: String
}

var struct = {
  category: String,
  facebook: facebookItem,
  name: String,
  wisdom: Number
}
var schema = new Schema(struct);
schema.virtual('tileId').get(function () {
  for (var i = 0; i < Tile.list.length; i++) {
    if (Tile.list[i].name === this.name) return Tile.list[i]._id;
  }
});
schema.virtual('premium').get(function () {
  return this.facebook && this.facebook.item_id ? true : false;
});

schema.statics.Purchase = function Find(playerId, itemId, callback) {
  function callbackOrErr(err, doc, cb) {
    if (err) { callback(err); }
    else if (!doc) { callback("Not found"); }
    else { cb(doc); }
  }
	
  function onItem(err, item) {
    function onPurchase(err, doc) {
      callback(err, item);
    }
    function onPlayer(err, player) {	
      function onMap(err, map) {
        callbackOrErr(err, map, function() {
          if (item.wisdom > player.wisdom) { callback("Not enough wisdom"); }
          else {
            map.nextTileId = item.tileId;
            map.save(); 
            player.wisdom = player.wisdom - item.wisdom;
            player.save(onPurchase);
          }	
        });
      }
      callbackOrErr(err, player, function() {
        Map.FindActive(playerId, onMap);
      });
    }

    callbackOrErr(err, item, function() {
      Player.findOne({_id: playerId}, onPlayer);
    })
  };
	
  return this.findOne({_id: itemId}, onItem);
}

var model = mongoose.model('Item', schema);

model.list = [];
model.lookups = {};
model.categories = {};
model.find({}, function(err, docs) {
  if (docs) {
    for (var i = 0; i < docs.length; i++) {
      model.list.push(docs[i]);
      model.lookups[docs[i]._id] = docs[i];
      if (!model.categories[docs[i].category]) model.categories[docs[i].category] = [];
      model.categories[docs[i].category].push(docs[i]);
    }	
  }
});

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}