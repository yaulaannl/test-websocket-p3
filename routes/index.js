//for authentication
panelKey = require('../authentication').panelKey;

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
  
  	//console.log('test devices at routes/index.js:' + devices );
  
  	res.render('panel', {
    		title: 'always absent.',
		devices: devices
  	});
  };
};

