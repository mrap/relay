'use strict'

var Browser  = require('zombie');
Browser.site = "http://localhost:5000/";

describe("User login", function(){
  var password = "my password";
  browser = new Browser();

  beforeEach(function(done){
    Factory.create('User', {password: password}, function(err, u){
      if (err) return done(err);
      user = u;
      done();
    });
  });

  describe("with valid credentials", function(){
    beforeEach(function(done){
      browser.visit('/login', function(){
        browser
          .fill("username", user.username)
          .fill("password", password)
          .pressButton("Login", function(err){
            done();
          });
      });
    });

    it("should redirect user to homepage", function(){
      browser.location.pathname.should.eq("/");
    });
  });

});
