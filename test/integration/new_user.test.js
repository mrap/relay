'use strict'

var Browser  = require('zombie');
Browser.site = "http://localhost:5000/";

describe("New User", function(){
  var attrs = { username: "mrap" }
  var connectionsCount = 10;
  var user = null;
  beforeEach(function(done){
    ScenarioFixture.UserWithConnectionsAndFeed(attrs, connectionsCount, function(err, u){
      if (err) return done(err);
      user = u;
      browser.visit("/").then(null, function(){
        done();
      });
    });
  });

  it("should show front page stuff");
});
