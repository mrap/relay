
describe("LinkPost", function(){
  beforeEach(function(done){
    Factory.create('LinkPost', function(err, res){
      if (err) done(err);
      post = res;
      done();
    });
  });

  it("should have a link", function(){
    expect(post.link).to.exist;
  });
});
