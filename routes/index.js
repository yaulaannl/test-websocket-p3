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
