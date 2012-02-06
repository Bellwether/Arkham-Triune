var client = require('../client');

module.exports = {
  Create: function(userId, score, callback) {
    var fb = new client();
    var params = {score: score};
    fb.request('post', '/'+userId+'/scores', params, callback);
  },
  Delete: function(userId, callback) {
    var fb = new client();
    fb.request('delete', '/'+userId+'/scores', null, callback);
  },
  DeleteAll: function(callback) {
    var fb = new client();
    fb.request('delete', '/APP_ID/scores', null, callback);
  }
}