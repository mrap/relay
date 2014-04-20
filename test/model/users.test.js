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

    it("should have a mongo id", function(done){
      user.id.should.exist
      done()
    })
  })
})
