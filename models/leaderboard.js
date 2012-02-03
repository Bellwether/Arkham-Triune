var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var score = require('./score');

var struct = {
  createdAt: Date,
  scores: [score.Schema]
}
var schema = new Schema(struct);

schema.statics.Create = function Create(playerId, mapId, points, callback) {
  var createdAt = Date.now();
  var leaderboard = new this()		
    createdAt: createdAt
  });

  return leaderboard.save(function (err, doc) {
    callback(err, doc);
  });
}

var model = mongoose.model('Leaderboard', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}