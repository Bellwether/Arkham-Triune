var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
}
var schema = new Schema(struct);

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