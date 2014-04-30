
describe("link_post", function(){
  beforeEach(function(done){
    Factory.create('link_post', function(err, res){
      if (err) done(err);
      LinkPost.findById(res._id).exec(function(err, res){
        post = res;
        done();
      })
    });
  });

  it("should have a `_type`", function(){
    expect(post._type).to.eq('link_post');
  });

  it("should have a link", function(){
    expect(post.link).to.exist;
  });

});
