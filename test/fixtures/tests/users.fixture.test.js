var expect = require('chai').expect;
var UserFixture = require('../users.fixture');

describe("UserFixture", function(){
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

