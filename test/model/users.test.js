require('../test_helper')
var should = require('chai').should();
var expect = require('chai').expect;
var User = require('../../model/user')
var UserFixture = require('../fixtures/users.fixture.js');
var Connection = require('../../model/connection');

describe("User Model", function(){
  describe("creating a user", function(){
    var user
    var originalPassword = "mypassword";
    var attrs = { password: originalPassword };
    beforeEach(function(done){
      UserFixture.createUser(attrs, function(err, u){
        user = u;
        done();
      });
    })

    it("should have a mongo id", function(){
      user.id.should.exist
    })

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
    var user1 = null;
    var user2 = null;
    var dist = 10;
    var result = null;
    var testUsersConnected = function(){
      it("should create a connection for both users", function(done){
        user1.getConnectionsCount(function(err, count){
          expect(count).to.eq(1);
          user2.getConnectionsCount(function(err, count){
            expect(count).to.eq(1);
            done();
          });
        });
      });

      it("should return the connection", function(){
        result.origin.should.eq(user1._id);
        result.target.should.eq(user2._id);
        result.distance.should.eq(dist);
      });
    };

    describe("User#connectUsers", function(){
      beforeEach(function(done){
        UserFixture.createUsers(2, null, function(err, users){
          user1 = users[0];
          user2 = users[1];
          User.connectUsers([user1, user2], dist, function(err, res){
            result = res;
            done();
          });
        });
      });
      testUsersConnected();
    });

    describe("#connectUsers", function(){
      beforeEach(function(done){
        UserFixture.createUsers(2, null, function(err, users){
          user1 = users[0];
          user2 = users[1];
          User.connectUsers([user1, user2], dist, function(err,res){
            result = res;
            done();
          })
        });
      });
      testUsersConnected();
    });

    describe("getting user's connections", function(){
      beforeEach(function(done){
        UserFixture.createUsers(2, null, function(err, users){
          user1 = users[0];
          user2 = users[1];
          User.connectUsers([user1, user2], dist, function(err, res){
            result = res;
            done();
          });
        });
      });

      describe("#getConnection", function(){
        it("should return array of connections with _ids", function(done){
          user1.getConnections(function(err, connections){
            var first = connections[0];
            first.target.toString().should.eq(result.target.toString());
            done();
          });
        });
      });

      describe("User#getConnectedUsers", function(){
        var user3 = null;
        beforeEach(function(done){
          UserFixture.createUser(null, function(err, u){
            user3 = u;
            user1.connectWithUser(dist, user3);
            user1.once("connected", function() {done(); });
          });
        });

        it("should return array of connections with User objects", function(done){
          User.getConnectedUsers(user1, function(err, connections){
            var first = connections[0];
            connections.containsUser(user2).should.be.true;
            connections.containsUser(user3).should.be.true;
            done();
          });
        });
      });
    });
  })
})
