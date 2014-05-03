'use strict'

var Browser  = require('zombie');
Browser.site = "http://localhost:5000/";

describe.skip("User feed", function(){
  var browser          = null
    , user             = null
    , posts            = null
    , attrs            = { username: "mrap", password: "my password" }
    , connectionsCount = 3;

  before(function(done){
    ScenarioFixture.UserWithConnectionsAndFeed(attrs, connectionsCount, function(err, u, extra){
      user = u;
      posts = extra.posts;
      browser = new Browser();
      integrationHelpers.userLoginBrowser(attrs.username, attrs.password, browser, function(err, b){
        browser = b;
        done();
      })
    });
  });

  it("should display username in header", function(){
    console.log(browser.html());
    expect(browser.text('#username')).to.eq(attrs.username);
  });
});
