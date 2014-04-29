describe("Relay Logic", function(){

  /*** Setup ***/
  var user             = null;
  var author           = null;
  var connUser         = null;
  var connUsers        = null;
  var post             = null;
  var initConnDist     = 10;
  var connectionsCount = 5;
  beforeEach(function(done){
    // Create User with connections
    // Author is only connected to user, but not it's other connections
    UserFixture.createUserWithConnections(connectionsCount, initConnDist, null, function(err, u){
      if (err) done(err);
      user = u;
      Factory.create('User', function(err, a){
        if (err) done(err);
        author = a;
        user.connectWithUser(initConnDist, author, function(err, res){
          if (err) return done(err);
          connectionsCount++;
          User.getConnectedUsers(user, function(err, res){
            if (err) done(err);
            connUsers = res;
            connUser  = (connUsers[0]._id.toString() !== author._id.toString()) ? connUsers[0] : connUsers[1];
            PostFixture.createByUser(null, author, function(err, p){
              if (err) done(err);
              post = p;
              done();
            });
          });
        });
      });
    });
  });

  describe("user relays a connected user's post", function(){
    beforeEach(function(done){
      user.relayOtherPost(post, function(err, res){
        if (err) done(err);
        done()
      });
    });

    it("should make author be closer to user", function(done){
      user.getDistanceToUser(author, function(err, dist){
        dist.should.not.eq(-1);
        dist.should.be.lt(initConnDist);
        done();
      });
    });

    it("should make all other connections further from user", function(done){
      function checkAnother(current){
        if (current >= connectionsCount) return done();
        var cUser = connUsers[current];
        if (cUser._id.toString() === author._id.toString()) return checkAnother(current+1);
        user.getDistanceToUser(cUser, function(err, dist){
          dist.should.be.gt(initConnDist);
          return checkAnother(current+1);
        });
      }
      checkAnother(0);
    });
  });
});
