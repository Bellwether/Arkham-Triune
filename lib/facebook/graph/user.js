var client = require('../client');

module.exports = {
  Get: function(accessToken, score, callback) {
    var fb = new client(accessToken);
    var params = {fields: 'id,name,first_name,gender,locale,timezone,location,friend_ids'};
    fb.request('get', '/me', params, callback);
  }
}