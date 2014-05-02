'use strict'

var LOGIN_URL = '/login';
var DEFAULT_PASSWORD = 'my password';

function userLoginBrowser(user, password, browser, done){
  if (!browser) return done(new Error("userLoginBrowser needs a browser!"), null);

  if (!user){
    Factory.create('User', {password: DEFAULT_PASSWORD}, function(err, newUser){
      if (err) return done(err);
      return userLoginBrowser(newUser, DEFAULT_PASSWORD, browser, done);
    });
  }

  else {
    // Login user in the browser
    browser.visit(LOGIN_URL, function(){
      browser
      .fill("username", user.username)
      .fill("password", password)
      .pressButton("Login", function(){
        return done(null, browser);
      });
    });
  }
};

// Handles with or without user
module.exports.userLoginBrowser = function(user, password, browser, done){
  if (typeof done === 'undefined') {
    done = password; browser = user;
    return userLoginBrowser(null, null, browser, done);
  }
 userLoginBrowser(user, password, browser, done);
};

