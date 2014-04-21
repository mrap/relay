require('../../test_helper');
var UserFixture = require('../users.fixture');

describe("UserFixture", function(){
  describe("Create a User", function(){
    var user = null;
    beforeEach(function(done){
      UserFixture.createUsers(3, null, function(err, res){
        user = res;
        done();
      });
    });

    it("should be successful", function(){
      user.should.exist;
    });
  });

  describe("Create a list of Users", function(){
    var users = null;
    beforeEach(function(done){
      UserFixture.createUsers(3, null, function(err, res){
        users = res;
        done();
      });
    });

    it("should be successful", function(){
      users[0]._id.toString().should.not.eq(users[1]._id.toString());
      users.length.should.eq(3);
    });
  });

  describe("Create a user with connections", function(){
    var user = null;
    var distance = 20;
    var connectionsCount = 10;
    beforeEach(function(done){
      // params (connections count, distance, user attributes, callback (returns user)
      UserFixture.createUserWithConnections(connectionsCount, distance, null, function(err, res){
        user = res;
        done();
      });
    });

    it("should have all connections", function(done){
      user.getConnectionsCount(function(err, count){
        count.should.eq(connectionsCount);
        done();
      });
    });
  });
});

