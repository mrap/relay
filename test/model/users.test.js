var should            = require('chai').should()
  , expect            = require('chai').expect
  , Factory           = require('../factories')
  , User              = require('mongoose').model('User')
  , arrayContainsUser = require('../../lib/global_helpers').arrayContainsUser;

describe("User Model", function(){
  var user = null;
  describe("building a user instance", function(){
    beforeEach(function(done){
      Factory.build('User', function(err, u){
        user = u;
        done();
      });
    });

    it("needs to be encrypted", function(){
      user.needsEncryption.should.be.true;
    });

    it("does not need to be encrypted after save", function(done){
      user.save(function(err){
        if (err) done(err);
        else {
          user.needsEncryption.should.be.false;
          done();
        }
      });
    });
  });

  describe("creating a user", function(){
    var email            = "mrap@relay.com";
    var originalPassword = "mypassword";
    var attrs            = { email: email, password: originalPassword };
    beforeEach(function(done){
      Factory.build('User', attrs, function(err, u){
        user = u;
        user.save(done);
      });
    });

    it("should have a mongo id", function(){
      user.id.should.exist;
    });

    it("should have no posts", function(){
      user.posts.should.be.empty
    })

    it("should hash the password", function(){
      expect(user.password).to.not.eq(originalPassword);
    });

    describe("checking for a valid password", function(){
      it("should return true for a valid password", function(done){
        user.isValidPassword(originalPassword, function(err, res){
          expect(res).to.be.true;
          done();
        });
      });

      it("should return false for a valid password", function(done){
        user.isValidPassword("not-my-password", function(err, res){
          expect(res).to.be.false;
          done();
        });
      });
    });
  })

  describe("connecting users", function(){
    // user is connected to connUser
    // user is not connected to notConnUser
    var connUser    = null;
    var notConnUser = null;
    var connection  = null;
    var dist        = 10;
    beforeEach(function(done){
      Factory.createList('User', 3, function(err, users){
        if (err) return done(err);
        user        = users[0];
        connUser    = users[1];
        notConnUser = users[2];
        done();
      });
    });

    var testUsersConnected = function(){
      it("should create a connection for both users", function(done){
        user.getConnectionsCount(function(err, count){
          expect(count).to.eq(1);
          connUser.getConnectionsCount(function(err, count){
            expect(count).to.eq(1);
            notConnUser.getConnectionsCount(function(err, count){
              expect(count).to.eq(0);
              done();
            });
          });
        });
      });

      it("should return the connection", function(){
        connection.origin.should.eq(user._id);
        connection.target.should.eq(connUser._id);
        connection.distance.should.eq(dist);
      });
    };

    describe("User#connectUsers", function(){
      beforeEach(function(done){
        User.connectUsers(user, connUser, dist, function(err, res){
          if (err) return done(err);
          connection = res;
          done();
        });
      });

      testUsersConnected();

      describe("getting user's connections", function(){
        describe("#getConnection", function(){
          it("should return array of connections with _ids", function(done){
            user.getConnections(function(err, connections){
              var first = connections[0];
              first.target.toString().should.eq(connection.target.toString());
              done();
            });
          });
        });

        describe("#getDistanceToUser", function(){
          beforeEach(function(done){
            Factory.create('User', function(err, res){
              if (err) return done(err);
              notConnUser = res;
              done();
            });
          });

          it("should return the correct distance to a connected user", function(done){
            user.getDistanceToUser(connUser, function(err, res){
              if (err) return done(err);
              res.should.eq(dist);
              done();
            });
          });

          it("should return -1 if not connected to user", function(done){
            user.getDistanceToUser(notConnUser, function(err, res){
              if (err) return done(err);
              res.should.eq(-1);
              done();
            });
          });
        });

        describe("User#getConnectedUsers", function(){
          it("should return array of connections with User objects", function(done){
            User.getConnectedUsers(user, function(err, connections){
              var first = connections[0];
              arrayContainsUser(connections, connUser).should.be.true;
              arrayContainsUser(connections, notConnUser).should.be.false;
              done();
            });
          });
        });
      });
    });
  })
})
