var FeedManager = require('../../model/feed_manager')
  , Factory     = require('../factories')
  , UserFixture = require('../fixtures/users.fixture')
  , mongoose    = require('mongoose')
  , User        = mongoose.model('User')
  , Post        = mongoose.model('Post')
  , expect      = require('chai').expect;
  

describe("Feed Manager", function(){
  var user             = null;
  var post             = null;
  var connectionsCount = 10;
  var connectionsDist  = 20;
  var result           = null;
  beforeEach(function(done){
    UserFixture.createUserWithConnections(connectionsCount, connectionsDist, null, function(err, u){
      if (err) done(err);
      user = u;
      Post.createPostByUser(user, null, function(err, p){
        if (err) done(err);
        post = p;
        done();
      })
    });
  });

  describe("#sendItemToConnections", function(){
    var connections = null;
    beforeEach(function(done){
      user.getConnections(function(err, res){
        if (err) done(err);
        connections = res;
        FeedManager.sendItemToConnections(post, connections, user, null, function(err, res){
          if (err) done(err);
          result = res;
          done();
        });
      });
    });

    it("should be in the given feeds", function(done){
      function checkAnother(current){
        if (current >= connectionsCount) return done();
        var connUserID = connections[current].target;
        FeedManager.userFeedHasItem(connUserID, post._id, function(err, res){
          if (err) return done(err);
          expect(res).to.eq.true;
        });
        checkAnother(current+1);
      }
      checkAnother(0);
    });
  });
});
