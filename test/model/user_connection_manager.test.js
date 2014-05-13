'use strict'

describe("UserConnectionManager", function(){

  describe.only("#getDiffBetweenStoredConnections", function(){
    var dist           = 10
      , user1          = null
      , user2          = null
      , user3          = null
      , oldConnections = null;

    // Setup connections
    beforeEach(function(done){
      UserFixture.createUserWithConnections(null, 2, 10, function(err, u1){
        if (err) return done(err);
        user1 = u1;
        UserConnectionManager.getUserConnections(user1, function(err, connections){
          if (err) return done(err);
          user2 = connections[0].target;
          user3 = connections[1].target;
          UserConnectionManager.connectUsers(user2, user3, dist, function(err, res){
            if (err) return done(err);
            UserConnectionManager.getUserConnectionsFromRedis(user1, function(err, storedConnections){
              oldConnections = storedConnections;
              done();
            })
          });
        });
      });
    });

    describe("when no differences between connections", function(){
      it("should return them in 'existingConnections' with a value of 0", function(done){
        UserConnectionManager.getDiffBetweenStoredConnections(oldConnections, oldConnections, function(err, result){
          if (err) return done(err);
          var existingConnections = result.existingConnections;
          expect(existingConnections[getObjectID(user2)]).to.eq(0);
          expect(existingConnections[getObjectID(user3)]).to.eq(0);
          done();
        });
      });
    });

    describe("when connection is new", function(){
      it("should return new connection in 'newConnections' with the new distance as the value", function(done){
        var uniqueDist = 19;
        Factory.create('User', function(err, newUser){
          UserConnectionManager.connectUsers(newUser, user1, uniqueDist, function(err, res){
            UserConnectionManager.getUserConnectionsFromRedis(user1, function(err, newConnections){
              if (err) return done(err);
              UserConnectionManager.getDiffBetweenStoredConnections(oldConnections, newConnections, function(err, result){
                if (err) return done(err);
                var newConnections = result.newConnections;
                expect( newConnections[ getObjectID(newUser) ] ).to.eq(uniqueDist);
                done();
              });
            });
          });
        });
      });
    });
  });

});
