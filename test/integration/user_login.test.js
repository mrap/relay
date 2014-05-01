'use script'

var Browser = require('zombie')
  , browser = new Browser();

describe("User login", function(){
  var password = "my password";

  beforeEach(function(done){
    Factory.create('User', {password: password}, function(err, u){
      if (err) return done(err);
      user = u;
      done();
    });
  });

  describe("with valid credentials", function(){
    beforeEach(function(done){
      browser.visit("/").then(done, function(){
        done();
      });
    });

    it("should redirect user to homepage", function(){
      browser.location.pathname.should.eq("/");
    });
  });

});
