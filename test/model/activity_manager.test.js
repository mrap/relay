var Factory         = require('../factories')
  , mongoose        = require('mongoose')
  , PostFixture     = require('../fixtures/posts.fixture')
  , helper          = require('../../lib/global_helpers')
  , containsObject  = helper.containsObject
  , ActivityManager = require('../../model/activity_manager');

describe("Activity Manager", function(){
  var user = null
    , post = null;
  beforeEach(function(done){
    Factory.createList('User', 2, function(err, users){
      if (err) return done(err);
      user = users[0];
      var author = users[1];
      author.connectWithUser(10, user, function(err, res){
        PostFixture.createByUser(null, author, function(err, p){
          if (err) return done(err);
          post = p;
          user.relayOtherPost(post, done);
        });
      });
    });
  });

  describe("When a user relays a post", function(){
    it("should add post to `top latest` feed", function(done){
      ActivityManager.getTopLatestPosts(0, 10, function(err, posts){
        containsObject(posts, post).should.be.true;
        done();
      });
    });
  });
});
