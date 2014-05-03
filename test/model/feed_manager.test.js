describe("Feed Manager", function(){
  var user             = null;
  var post             = null;
  var feedItem         = null;
  var connectionsCount = 10;
  var connectionsDist  = 20;
  var connections      = null;
  var connectedUserID  = null;
  var result           = null;

  beforeEach(function(done){
    UserFixture.createUserWithConnections({}, connectionsCount, connectionsDist, function(err, u){
      if (err) done(err);
      user = u;
      Factory.create('Post', function(err, p){
        if (err) done(err);
        post = p;
        feedItem = new FeedItem({postID: post._id, senderID: user._id, score: 30})
        done();
      });
    });
  });

  describe("#sendItemToConnections", function(){
    beforeEach(function(done){
      user.getConnections(function(err, res){
        if (err) done(err);
        connections = res;
        connectedUserID  = connections[0].target;
        FeedManager.sendItemToConnections(feedItem, connections, function(err, res){
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

    describe("#getUserFeedPosts", function(){
      it("should return the post from db with feedItem assigned", function(done){
        FeedManager.getUserFeedPosts(connectedUserID, null, function(err, posts){
          if (err) return done(err);
          var first = posts[0];
          eqObjectIDs(first.feedItem.postID, post.id);
          done();
        });
      });
    });

    describe("#getUserFeedItem", function(){
      it("should return the correct Feed Item", function(done){
        FeedManager.getUserFeedItem(connectedUserID, post, function(err, item){
          if (err) done(err);
          expect(item.postID.toString()).to.eq(feedItem.postID.toString());
          expect(item.senderID.toString()).to.eq(feedItem.senderID.toString());
          expect(item.originDistance).to.eq(feedItem.originDistance);
          done();
        });
      });
    });
  });
});
