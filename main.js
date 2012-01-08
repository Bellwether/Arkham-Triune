(function() {
  var server = require('./lib/server/server.js');
  server.RunApp();
  server.RunDaemons();
})();