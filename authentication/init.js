const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const user = {
  username: 'user',
  password: 'passwd',
  id: 1
}

function findUser (username, callback) {
  if (username === user.username) {
    return callback(null, user)
  }
  return callback(null)
}

passport.serializeUser(function (user, cb) {
  cb(null, user.username)
})

passport.deserializeUser(function (username, cb) {
  findUser(username, cb)
})

function initPassport () {
  passport.use(new LocalStrategy(
    function(username, password, done) {
      findUser(username, function (err, user) {
        if (err) {
          return done(err)
        }
        if (!user) {
          return done(null, false)
        }
        if (password !== user.password  ) {
          return done(null, false)
        }
	console.log('logging in')
	return done(null, user)
      })
    }
  ))

}

module.exports = initPassport
