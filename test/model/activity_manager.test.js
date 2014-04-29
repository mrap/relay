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
          done();
        });
      });
    });
  });

  describe("When a user relays a post", function(){
    beforeEach(function(done){
      user.relayOtherPost(post, done);
    });
    it("should add post to `top latest` feed", function(done){
      ActivityManager.getPopularPosts(0, 10, function(err, posts){
        containsObject(posts, post).should.be.true;
        done();
      });
    });
  });

  describe("When a user creates a post", function(){
    it("should add post to `top latest` feed", function(done){
      ActivityManager.getPopularPosts(0, 10, function(err, posts){
        containsObject(posts, post).should.be.true;
        done();
      });
    });
  });
});
