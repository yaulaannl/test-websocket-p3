//for authentication
apiKey = require('../authentication').apiKeys[0];

//home page
exports.home = function(req, res) {
  res.render('home', {
    title: 'always absent.'
  });
};

exports.login = function(req, res) {
  res.render('login', {
    title: 'always absent.'
  });
};


exports.panel = function(devices){
  return  function(req, res, next) {
	var dkeys = Object.keys(devices);  
  	console.log('test devices at routes/index.js:' + dkeys );
  
  	res.render('panel', {
    		title: 'always absent.',
		devices: dkeys,
		apiKey: apiKey
  	});
  };
};

