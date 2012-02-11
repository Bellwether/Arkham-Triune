var querystring = require('querystring');
var https = require('https');
var config = require('./config');

var appAccessToken = null;
var getAppAccessToken = function(client, callback) {
  if (appAccessToken) {
    callback(null, appAccessToken);
    return;
  };

  client.sendRequest(options, function(err, data) {
    console.log("getAppAccessToken = "+data);
    if (err) {
      callback(err);
    } else {
      appAccessToken = data.split('=', 2)[1];
      callback(err, appAccessToken)
    }
  })
}

var Client = function(access_token) {
  this.access_token = access_token || null;
  this.host = 'graph.facebook.com';
  this.port = 443;
}

Client.prototype.getRedirectUri = function getRedirectUri() {
  return "https://"+config.appDomain+"/facebook";
}
Client.prototype.getAppLoginUrl = function getAppLoginUrl() {
  return "https://graph.facebook.com/oauth/access_token?" +
         "client_id="+config.appKey+"&client_secret="+config.appSecret+"&" + 
         "grant_type=client_credentials"
}
Client.prototype.getOAuthDialogUrl = function getOAuthDialogUrl(state) {
  return "https://www.facebook.com/dialog/oauth/?" +
         "scope="+config.appPermissions+"&" +
         "client_id="+config.appKey+"&" +
         "state="+state+"&" +
         "redirect_uri="+this.getRedirectUri();
}
Client.prototype.getPayDialogUrl = function getPayDialogUrl(item) {
  return "https://www.facebook.com/dialog/pay?" +
         "app_id="+config.appKey+"&" +
         "redirect_uri="+this.getRedirectUri()+"&" +
         "action=buy_item&" +
         "order_info="+item._id+"&" +
         "dev_purchase_params={'oscif':true}"
}
Client.prototype.requestAccessToken = function requestAccessToken(code, callback) {
  var params = {
    client_id: config.appKey,
    client_secret: config.appSecret,
    code: code,
    redirect_uri: this.getRedirectUri()
  }
  this.request('get', '/oauth/access_token', params, callback);
};

Client.prototype.request = function request(method, path, params, callback) {
  params = params || {};
  params.access_token = params.access_token || this.access_token;

  var opts = {
    'method': method,
    'host': this.host,
    'port': this.port,
    'path': path
  };

  if (method === 'get') {
    opts.path += '?' + querystring.stringify(params);
  } else {
    opts.body = querystring.stringify(params);
  }

  this.sendRequest(opts, callback);
};
Client.prototype.sendRequest = function sendRequest(options, callback) {
  var data = '';
  var req = https.request( opts, 
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
}

module.exports = Client;