'use strict'

var request = require('supertest');

describe("Utils Requests", function(){
  var agent  = null
    , cookie = null
    , body   = null;
  beforeEach(function(){
    agent = request.agent(server);
  });

  // Skip because it could take a few seconds
  describe.skip("GET #getImageUrl", function(){
    this.timeout(4000);
    var url = "http://davidwalsh.name/facebook-meta-tags"
      , expectedUrl = "http://davidwalsh.name/wp-content/themes/jack/images/openGraphLogo.png";
    beforeEach(function(done){
      agent
        .get('/utils/getImageUrl?url='+encodeURIComponent(url) )
        .expect(200, function(err, res){
          if (err) return done(err);
          body = res.body;
          done();
        });
    });
    it("should send the correct 'url'", function(){
      expect(body.url).to.eq(expectedUrl);
    });
  });
});
