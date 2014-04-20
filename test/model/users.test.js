require('../test_helper')
var should = require('chai').should()
var User = require('../../model/user')

describe("User Model", function(){
  describe("creating a user", function(){
    var user
    beforeEach(function(done){
      User.createUser({}, function(err, res){
        user = res
        done()
      })
    })

    it("should have a mongo id", function(){
      user.id.should.exist
    })

    it("should have no posts", function(){
      user.posts.should.be.empty
    })
  })

  describe("#connectUsers", function(){
    var client = require('redis').createClient();
    var key = require('../../model/redis_key');
    var user1 = null;
    var user2 = null;
    var dist = 10;
    var result = null;
    beforeEach(function(done){
      User.createUser({}, function(err, res){
        user1 = res;
        User.createUser({}, function(err, res){
          user2 = res;
          User.connectUsers([user1, user2], dist, function(err, res){
            result = res;
            done();
          });
        });
      })
    })

    it("should create a connection for both users", function(done){
      var key1 = key.keyIDAttribute('user', user1._id, 'connections');
      var key2 = key.keyIDAttribute('user', user2._id, 'connections');
      client.zscore(key1, user2._id, function(err, res){
        if (err) throw(err);
        res.should.eq(dist.toString());
        client.zscore(key2, user1._id, function(err, res){
          if (err) throw(err);
          res.should.eq(dist.toString());
          done();
        })
      })

    })

    it("should return the connection distance", function(){
      result.should.eq(dist)
    })
  })
})
