var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var score = require('./score');

var ranking = {
  createdAt: Date,
  mapId: String,
  playerId: String,
  points: Number,
};

var struct = {
  createdAt: Date,
  scores: [ranking],
  type: String
}
var schema = new Schema(struct);

schema.statics.NewLeaderboard = function NewLeaderboard(rankingAttribute, callback) {
  var self = this;
  this.FindCurrent(rankingAttribute, function(err, currentDoc) {	
    var createdAt = Date.now();

    // only update leaderboard once per hour
    if (currentDoc) {
      var lastDate = new Date(createdAt);
      lastDate.setHours(lastDate.getHours() - 1);
      var hasUpdatedInLastHour = currentDoc.createdAt >= lastDate;

      if (hasUpdatedInLastHour) {
        callback();
        return;
      }
    }
	
    var leaderboard = new self({
      createdAt: createdAt,
      type: rankingAttribute
    });

    function onScores(err, docs) {
      docs.forEach(function(doc) {
        var ranking = {mapId: doc.mapId, playerId: doc.playerId, points: doc[rankingAttribute], createdAt: doc.createdAt};
        leaderboard.scores.push(ranking);
      });

      callback(err, leaderboard);
    }

    var findDate = new Date(createdAt);
    var twoWeeksInDays = 14;
    findDate.setDate(findDate.getDate() - twoWeeksInDays);

    var filter = {limit: 25, sort: {}};
    filter.sort[rankingAttribute] = -1;

    score.Model.find({'createdAt': {'$gt': findDate}}, [], filter, onScores);
  });
}
schema.statics.CreateHighScoreLeaderboard = function CreateHighScoreLeaderboard(callback) {
  return model.NewLeaderboard('points', function(err, leaderboard) {
    if (leaderboard) {
      leaderboard.save(function (err, doc) {
        if (typeof callback === 'function') callback(err, doc);
      });
    } else if (typeof callback === 'function') {
      callback(err);
    };
  });
}
schema.statics.CreateMostMovesLeaderboard = function CreateMostMovesLeaderboard(callback) {
  return model.NewLeaderboard('moves', function(err, leaderboard) {
    if (leaderboard) {
      leaderboard.save(function (err, doc) {
        if (typeof callback === 'function') callback(err, doc);
      });
    } else if (typeof callback === 'function') {
      callback(err);
    };
  });
}

schema.statics.FindCurrent = function FindCurrent(type, callback) {
  var query = {type: type};
  var filter = {sort: {'createdAt': 1}};
  return this.findOne(query, [], filter, callback);
}
schema.statics.Find = function Find(callback) {
  var results = {moves: false, points: false, leaderboards: []};
  function onLeaderboard(err, doc) {
    if (err) {
    } else if (doc) {
      results[doc.type] = true;
      results.leaderboards.push(doc);
    }
    if (results.moves && results.points) callback(null, results.leaderboards);
  }
  this.FindCurrent('points', onLeaderboard);
  this.FindCurrent('moves', onLeaderboard);
}
schema.statics.Rank = function Create(playerId, mapId, points, callback) {
  model.CreateHighScoreLeaderboard();
  model.CreateMostMovesLeaderboard();
}

var model = mongoose.model('Leaderboard', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}