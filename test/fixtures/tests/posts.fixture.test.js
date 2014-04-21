require('../../test_helper');
var PostFixture = require('../posts.fixture');
var UserFixture = require('../users.fixture');

describe("PostFixture", function(){
  describe("creating a post", function(){
    describe("without a user", function(){
      it("should be successful", function(done){
        PostFixture.createPost(null, function(err, post){
          post._author.should.exist
          done();
        });
      });
    });
    describe("with a user", function(){
      var author = null;
      beforeEach(function(done){
        author = UserFixture.createUser(null);
        author.once("created", done);
      });

      it("should be successful", function(done){
        PostFixture.createPost({_author: author._id}, function(err, post){
          post._author.toString().should.eq(author._id.toString());
          done();
        });
      });
    });
  });
});
