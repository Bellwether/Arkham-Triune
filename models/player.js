var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
  wisdom: {type: Number, default: 50}
}
var schema = new Schema(struct);


schema.statics.Wisen = function Wisen(playerId, wisdom, callback) {
  if (wisdom === 0) {
    if (typeof callback === 'function') callback('No change in wisdom');
    return;	
  }
  function onPlayer(err, doc) {
    if (doc) {	
      doc.wisdom = Math.max(doc.wisdom + wisdom, 0);
      doc.save(callback);
    } else {
      if (typeof callback === 'function') callback(err || 'Player not found');
    }
  }

  return this.findOne({_id: playerId}, onPlayer);	
}
schema.statics.Find = function Find(playerId, callback) {
  var query = {_id: playerId};
  return this.findOne(query, callback);
}
schema.statics.Create = function Create(params, callback) {
  params = params || {};
  var player = new this();

  return player.save(function (err, doc) {
    callback(err, doc);
  });
}
var model = mongoose.model('Player', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}