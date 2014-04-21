require('../test_helper')
var should = require('chai').should();
var expect = require('chai').expect;
var User = require('../../model/user')
var UserFixture = require('../fixtures/users.fixture.js');

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

  describe("#connectWithUser", function(){
    var user1 = null;
    var user2 = null;
    var dist = 10;
    var result = null;
    beforeEach(function(done){
      UserFixture.createUsers(2, null, function(err, users){
        user1 = users[0];
        user2 = users[1];
        user1.connectWithUser(dist, user2, function(err, res){
          result = res;
          done();
        });
      });
    })

    it("should create a connection for both users", function(done){
      user1.getConnectionsCount(function(err, res){
        expect(res).to.eq(1);
        user2.getConnectionsCount(function(err, res){
          expect(res).to.eq(1);
          done();
        });
      });
    });

    it("should return the connection distance", function(){
      result.should.eq(dist);
    });
  })
})
