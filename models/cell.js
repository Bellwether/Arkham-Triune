var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var struct = {
  tileId: Schema.ObjectId
}
var schema = new Schema(struct);
schema.virtual('empty').get(function () {
  return this.tileId ? false : true;
});
var model = mongoose.model('Cell', schema);

module.exports = {
  Struct: struct,
  Schema: schema,
  Model: model
}