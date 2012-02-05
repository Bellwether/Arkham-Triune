exports.init = function(app){
  var env = 'development';
  app.configure('production', function () {
	env = 'production';
  });	
	
  app.dynamicHelpers({
	head: function(req) {
	  return {
	    title: 'Arkham Triune',
	    author: 'Travis Dunn',
	    description: "A match-3 city sim set in Lovecraft Country Arkham"
      }
	},
	environment: function(req) {
	  return function(isEnvironment) {	
	    if (isEnvironment) {
	      return env === isEnvironment;
	    } else {
	      return env;
	    }
	  }
	},
    facebook: function(req)	 {
      var isCanvas = req.canvas ? true : false;

      return {
        canvas: isCanvas
      }
    },
	currentUrl: function(req) {	
      return req.url;
    },
	sessionId: function(req) {
	  return req.session ? req.session.id : null;	
	}
  });
};