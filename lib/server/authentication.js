var player = require('./../../models/player');

var Authentication = function(req) {
  this.session = req.session;
  this.authenticationUrl = '/';
}

Authentication.prototype.__defineGetter__('playerId', function () {
  return this.session.playerId;
})
Authentication.prototype.__defineGetter__('authenticated', function () {
  return this.session.playerId ? true : false;
})
Authentication.prototype.authenticate = function authenticate(callback) {
  if (this.authenticated) {
    callback();
  } else {
    var self = this;
    player.Model.Create({}, function(err, doc) {
      if (doc) {
        self.session.playerId = doc._id;
      }
      callback(err, doc);
    })
  }
};

exports.init = function (app) {
  app.use(function (req, res, next) {
    req.authentication = new Authentication(req);
    req.authentication.authenticate(function() {
      next();
    })
  });
};