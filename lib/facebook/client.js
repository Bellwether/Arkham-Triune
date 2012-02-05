var querystring = require('querystring');
var https = require('https');
var config = require('./config');

var Client = function(access_token) {
  this.access_token = access_token || null;
  this.host = 'graph.facebook.com';
  this.port = 443;
}

Client.prototype.getOAuthDialogUrl = function getOAuthDialogUrl() {
  var url = "https://www.facebook.com/dialog/oauth/?" +
            "scope="+config.appPermissions+"&" +
            "client_id="+config.appKey+"&" +
            "redirect_uri=https://"+config.appDomain+"/facebook";
  return url;
}

Client.prototype.request = function request(method, path, params, callback) {
  params = params || {};
  var data = '';

  var req = https.request({
      'method': method,
      'host': this.host,
      'port': this.port,
      'path': path
    }, 
    function (res) {
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        try {
          var result = JSON.parse(data);
          callback(result.error || null, result.data || result);
        } catch (err) {
          callback(err, data);
        }
      });
  }).on('error', function (err) {
    callback(err);
  });

  if (data) {
    req.write(querystring.stringify(data));
  }
  req.end();
};


module.exports = Client;