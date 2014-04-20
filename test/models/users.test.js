var should = require('chai').should()

var User
/*** Setup ***/
beforeEach(function(done){
  process.env.NODE_ENV = 'test'
  var app = require('../../app')
  User = require('../../model/user')
  done()
})

/*** Tear Down ***/
var mongoose = require('mongoose')
afterEach(function(done){
  // Clean DB
  mongoose.connection.close(done())
})

describe("User Model", function(){
  describe("creating a user", function(){
    var user
    beforeEach(function(done){
      User.createUser({}, function(err, res){
        if (err) done(err)
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
