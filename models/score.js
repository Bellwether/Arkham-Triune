var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
  createdAt: Date,	
  mapId: String,
  moves: Number,
  points: Number,
  playerId: String
}
var schema = new Schema(struct);

schema.statics.Create = function Create(playerId, mapId, params, callback) {
  var createdAt = Date.now();
  var score = new this({
    createdAt: createdAt,
    mapId: mapId,
    moves: params.moves,
    playerId: playerId,
    points: params.points
  });

  return score.save(function (err, doc) {
    if (typeof callback === 'function') callback(err, doc);
  });
}

var model = mongoose.model('Score', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}