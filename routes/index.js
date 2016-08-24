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


exports.panel = function(req, res, next) {
  //validate panelKey
  /*
  error = Err.bind(this, next) 
  if(req.params['panelKey'] !== panelKey){
	  return error(404,'panel key not correct.');
  }	  
  */
  res.render('panel', {
    title: 'always absent.'
  });
};


/* exported Err */
function Err(next, status, message) {

	  var err = new Error(message);
	    err.status = status;

	      return next(err);

}
