'use strict'

var Browser  = require('zombie');
Browser.site = "http://localhost:5000/";

describe.skip("User login", function(){
  var user = null
    , password = "my password"

  beforeEach(function(done){
    Factory.create('User', {password: password}, function(err, u){
      if (err) return done(err);
      user = u;
      done();
    });
  });

  describe("with valid credentials", function(){
    var browser = null;
    beforeEach(function(done){
      browser = new Browser();
      integrationHelpers.userLoginBrowser(user.username, password, browser, function(err, b){
        if (err) return done(err);
        browser = b;
        done();
      });
    });

    it("should redirect user to homepage", function(){
      browser.location.pathname.should.eq("/");
    });

    describe("visiting /login as a logged in user", function(){
      it("should not display the login form", function(done){
        browser.visit('/login', function(err){
          expect(browser.query('form')).to.not.exist;
          done();
        });
      });
    });
  });
});
