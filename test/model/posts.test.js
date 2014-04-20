require('../test_helper');
var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect;

var User = require('../../model/user');
var Post = require('../../model/post');
describe("Post Model", function(){
  describe("Creating a post", function(){
    var post = null;
    var user = null;
    beforeEach(function(done){
      User.createUser({}, function(err, res){
        user = res;
        Post.createPost({_author: user._id}, function(err, res){
          expect(err).not.to.exist
          post = res
          done()
        })
      })
    })

    it("should save and return and the post", function(){
      post.should.exist
    })

    it("should have the authors user id", function(){
      expect(post._author).to.eq(user._id)
    })

    it("should be saved to the author's posts", function(done){
      User.findById(user._id, 'posts', function(err, res){
        expect(res.posts).to.include(post._id)
        done()
      })
    })
  })
})
