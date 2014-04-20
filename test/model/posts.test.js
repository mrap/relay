require('../test_helper');
var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect;

var User = require('../../model/user');
var Post = require('../../model/post');
describe("Post Model", function(){
  describe("Creating a post", function(){

    describe("without a user id", function(){
      it("should not save and return an error", function(done){
        Post.createPost(null, {}, function(err, res){
          expect(res).not.to.exist
          expect(err).to.be.instanceof(Error)
          done()
        })
      })
    })

    describe("with an invalid user id", function(){
      it("should not save and return an error", function(done){
        Post.createPost("an-invalid-id", {}, function(err, res){
          expect(res).not.to.exist
          expect(err).to.be.instanceof(Error)
          done()
        })
      })
    })

    describe("with an valid user id", function(){
      it("should save and return and the post", function(done){
        User.createUser({}, function(err, res){
          var user_id = res;
          Post.createPost(user_id, {}, function(err, res){
            expect(err).not.to.exist
            expect(res).to.exist
            done()
          })
        })
      })
    })
  })
})
