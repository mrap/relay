var chai        = require('chai'),
    should      = chai.should(),
    expect      = chai.expect,
    Factory     = require('../factories'),
    UserFixture = require('../fixtures/users.fixture'),
    PostFixture = require('../fixtures/posts.fixture'),
    mongoose    = require('mongoose'),
    Post        = mongoose.model('Post'),
    User        = mongoose.model('User'),
    helper      = require('../../lib/global_helpers'),
    getObjectID = helper.getObjectID,
    containsObject = helper.containsObject;
    

describe("Post Model", function(){
  var post = null;
  var user = null;

  describe("Creating a post", function(){
    beforeEach(function(done){
      Factory.create('User', function(err, u){
        if (err) return done(err);
        user = u;
        PostFixture.createByUser(null, user, function(err, p){
          if (err) return done(err);
          post = p;
          done();
        });
      });
    });

    it("should have an _author reference", function(){
      post._author.toString().should.eq(user._id.toString());
    });
  });

  describe("Creating a post", function(){
    beforeEach(function(done){
      UserFixture.createUserWithConnections(3, 10, null, function(err, res){
        if (err) return done(err);
        user = res;
        PostFixture.createByUser(null, user, function(err, p){
          post = p;
          done();
        });
      })
    })

    it("should save and return and the post", function(){
      post.should.exist
    })

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

    describe("option: WITH_AUTHOR", function(){
      it("should return the full author object too", function(done){
        Post.findByIds(postIds, {WITH_AUTHOR: true}, function(err, posts){
          if (err) return done(err);
          containsObject(postIds, posts[0]);
          containsObject(postIds, posts[1]);
          done();
        });
      });
    });
  });
})
