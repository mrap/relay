'use strict'

var LOGIN_URL = '/login'
  , DEFAULT_PASSWORD = 'my password'
  , Browser  = require('zombie');

Browser.site = "http://localhost:5000/";

function userLoginBrowser(username, password, browser, done){
  if (!browser) return done(new Error("userLoginBrowser needs a browser!"), null);

  if (!username || !password){
    Factory.create('User', {password: DEFAULT_PASSWORD}, function(err, newUser){
      if (err) return done(err);
      return userLoginBrowser(newUser, DEFAULT_PASSWORD, browser, done);
    });
  }

  else {
    // Login user in the browser
    browser.visit(LOGIN_URL, function(){
      browser
      .fill("username", username)
      .fill("password", password)
      .pressButton("Login", function(){
        return done(null, browser);
      });
    });
  }
};

// Handles with or without user
module.exports.userLoginBrowser = function(username, password, browser, done){

  // One arg, callback only
  if (typeof password === 'undefined') {
    done = username;
    browser = new Browser();
    return userLoginBrowser(null, null, browser, done);
  }

  // Two args, browser and callback
  else if (typeof done === 'undefined') {
    done = password; browser = username;
    return userLoginBrowser(null, null, browser, done);
  }

  // All args
 userLoginBrowser(username, password, browser, done);
};

