var passport      = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , User          = require('mongoose').model('User');

// Serialize the user id to push into the session
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// Deserialize the user object based on a pre-serialized token
// which is the user id
passport.deserializeUser(function(id, done) {
  User.findById(id, done);
});

var localStrategy = new LocalStrategy(function(username, password, done){
  User.findOne({ username: username }, '+password', function(err, user){
    if (err) return done(err);
    var invalidUserMessage = 'Invalid username or password';

    // Ensure user exists
    if (!user) return done(null, false, { message: invalidUserMessage });

    // Validate correct password
    user.isValidPassword(password, function(err, res){
      if (err) return done(err);

      if (!res) return done(null, false, { message: invalidUserMessage });
      // Return user
      return done(null, user);
    });
  });
});


passport.use('local-signup', localStrategy);

module.exports = passport;
