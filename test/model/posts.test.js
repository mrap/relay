describe("Post Model", function(){
  var post = null;
  var user = null;

  // Create the user
  beforeEach(function(done){
    UserFixture.createUserWithConnections(3, 10, null, function(err, res){
      if (err) return done(err);
      user = res;
      PostFixture.createByUser(null, user, function(err, p){
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
      post._author.toString().should.eq(user._id.toString());
    });

    it("should be saved to the author's posts", function(done){
      User.findById(user._id, 'posts', function(err, res){
        expect(res.posts).to.include(post._id)
        done()
      })
    })

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
    Post.getPopularPosts(0, 10, function(err, posts){
      containsObject(posts, post).should.be.true;
      done();
    });
  });
  
  describe("when a post is relayed", function(){
    var relayer = null;
    beforeEach(function(done){
      Factory.create('User', function(err, u){
        relayer = u;
        user.connectWithUser(10, relayer, function(err, res){
          PostFixture.createByUser(null, user, function(err, p){
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
  });

  describe("#findByIds", function(){
    var postIds = null;
    beforeEach(function(done){
      Factory.create('User', function(err, u){
        user = u;
        PostFixture.createByUser(null, user, function(err, p1){
          PostFixture.createByUser(null, user, function(err, p2){
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
            PostFixture.createByUser(null, user, function(err, p){
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
