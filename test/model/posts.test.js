describe("Post Model", function(){
  var post = null;
  var user = null;
  var connectionCount = 3;

  // Create the user
  beforeEach(function(done){
    ScenarioFixture.UserWithConnectionsAndFeed({}, connectionCount, function(err, u, extra){
      if (err) return done(err);
      user = u;
      PostFixture.createByUserWithType(null, user, null, function(err, p){
        if (err) return done(err);
        post = p;
        done();
      });
    })
  });

  describe("Creating a post", function(){
    it("should save and return and the post", function(){
      post.should.exist
    })

    it("should have an _author reference", function(){
      eqObjectIDs(post._author, user).should.be.true;
    });

    it("should be saved to the author's posts", function(done){
      User.findById(user._id, 'posts', function(err, res){
        expect(res.posts).to.include(post._id)
        done()
      })
    })

    it("should save to author's feed as the highest ranked item", function(done){
      FeedManager.getUserFeedItem(user, post, function(err, res){
        if (err) return done(err);
        expect(res).to.exist;
        var postScore = res.score;
        FeedManager.getUserFeedPosts(user, function(err, posts){
          if (err) return done(err);
          for(var i = 0; i<posts.length; i++) {
            var currentPost = posts[i];
            if (eqObjectIDs(currentPost, post)) continue;
            expect(currentPost.feedItem.score).to.be.at.gte(postScore);
          }
          done();
        });
      });
    });


    it("should save to each author's connection's feed", function(done){
      User.getConnectedUsers(user, function(err, users){
        var otherUser     = null;
        var callbackCount = 0;
        for(var i = 0; i < users.length; i++){
          otherUser = users[i];
          otherUser.getFeedPostIds(function(err, feed){
            // Each callback should increment the callback count
            feed.should.include(post._id.toString());
            callbackCount++;
            if (callbackCount == i) done();
          });
        }
      });
    });
  })

  it("should add post to `popular posts`", function(done){
    // wait for Events Monitor to update popular posts
    setTimeout(function(){
      Post.getPopularPosts(0, 10, function(err, posts){
        containsObject(posts, post).should.be.true;
        done();
      });
    }, 1000);
  });

  describe("when a post is relayed", function(){
    var relayer = null;
    beforeEach(function(done){
      Factory.create('User', function(err, u){
        relayer = u;
        user.connectWithUser(10, relayer, function(err, res){
          PostFixture.createByUserWithType(null, user, null, function(err, p){
            post = p;
            relayer.relayOtherPost(post, done);
          });
        });
      });
    });

    it("should add post to `popular` feed", function(done){
      Post.getPopularPosts(0, 10, function(err, posts){
        containsObject(posts, post).should.be.true;
        done();
      });
    });

    it("should update post `last relayed by`", function(done){
      Post.findById(post._id).populate('_last_relayed_by').exec(function(err, res){
        eqObjectIDs(res._last_relayed_by, relayer).should.be.true;
        done();
      });
    });

    it("should update post `__relay_count`", function(done){
      Post.findById(post._id).select('+__relay_count').exec(function(err, res){
        expect(res.__relay_count).to.eq(1);
        done();
      });
    });
  });

  describe("#findByIds", function(){
    var postIds = null;
    beforeEach(function(done){
      Factory.create('User', function(err, u){
        user = u;
        PostFixture.createByUserWithType(null, user, null, function(err, p1){
          PostFixture.createByUserWithType(null, user, null, function(err, p2){
            postIds = [getObjectID(p1), getObjectID(p2)];
            done();
          });
        });
      });
    });

    it("should return the posts", function(done){
      Post.findByIds(postIds, {}, function(err, posts){
        if (err) return done(err);
        containsObject(postIds, posts[0]);
        containsObject(postIds, posts[1]);
        done();
      });
    });

    describe("option: WITH_AUTHOR", function(){
      beforeEach(function(done){
        Post.findByIds(postIds, {WITH_AUTHOR: true}, function(err, posts){
          if (err) return done(err);
          firstPost = posts[0];
          done();
        });
      });
      it("should return the full author object too", function(){
        eqObjectIDs(firstPost._author, user).should.be.true;
      });
      it("should not include author's password field", function(){
        firstPost._author.should.not.have.ownProperty('password');
      });
    });

    describe("option: WITH_LAST_RELAYED_BY", function(){
      var relayer = null;
      beforeEach(function(done){
        Factory.create('User', function(err, u){
          relayer = u;
          user.connectWithUser(10, relayer, function(err, res){
            PostFixture.createByUserWithType(null, user, null, function(err, p){
              post = p;
              postIds = [post._id];
              relayer.relayOtherPost(post, done);
            });
          });
        });
      });

      it("should return the last relayer", function(done){
        Post.findByIds(postIds, {WITH_LAST_RELAYED_BY: true}, function(err, posts){
          if (err) return done(err);
          var first = posts[0];
          eqObjectIDs(first._last_relayed_by, relayer);
          done();
        });
      });
    });
  });
})
