require('../test_helper')
var should = require('chai').should();
var expect = require('chai').expect;
var User = require('../../model/user')
var UserFixture = require('../fixtures/users.fixture.js');
var Connection = require('../../model/connection');

describe("User Model", function(){
  describe("creating a user", function(){
    var user
    var attrs = {};
    beforeEach(function(done){
      UserFixture.createUser(attrs, function(err, res){
        user = res;
        done();
      });
    })

    it("should have a mongo id", function(){
      user.id.should.exist
    })

    it("should have no posts", function(){
      user.posts.should.be.empty
    })
  })

  describe("connecting users", function(){
    var user1 = null;
    var user2 = null;
    var dist = 10;
    var result = null;
    var testUsersConnected = function(){
      it("should create a connection for both users", function(done){
        user1.getConnectionsCount(function(err, res){
          expect(res).to.eq(1);
          user2.getConnectionsCount(function(err, res){
            expect(res).to.eq(1);
            done();
          });
        });
      });

      it("should return the connection", function(){
        result.origin.should.eq(user1);
        result.target.should.eq(user2);
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
          user1.connectWithUser(dist, user2, function(err, res){
            result = res;
            done();
          });
        });
      });
      testUsersConnected();
    });

    describe("#getConnectedUsers", function(){
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

      // it("should return an array of connections")

    });
  })
})
