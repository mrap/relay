
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

  // Slow request tests
  describe.skip("preview photo url", function(){
    this.timeout(5000);

    describe("updating a link_post's preview_photo_url", function(){
      var url = "http://davidwalsh.name/facebook-meta-tags"
        , expectedUrl = "http://davidwalsh.name/wp-content/themes/jack/images/openGraphLogo.png";
      beforeEach(function(done){
        PostFixture.createByUserWithType({link: url}, null, 'link_post', function(err, res){
          if (err) return done(err);
          post = res;
          LinkPost.updatePostPreviewPhotoUrl(post, done);
        });
      });

      it("should save the preview photo url", function(done){
        Post.findById(post.id, function(err, res){
          if (err) return done(err);
          expect(res.preview_photo_url).to.eq(expectedUrl);
          done();
        });
      });
    });

    describe("#getPreviewPhotoUrl", function(){

      describe("site with og:image", function(){
        var url = "http://davidwalsh.name/facebook-meta-tags"
          , expectedUrl = "http://davidwalsh.name/wp-content/themes/jack/images/openGraphLogo.png";
        it("should return the correct url", function(done){
          LinkPost.getPreviewPhotoUrl(url, function(err, res){
            if (err) return done(err);
            expect(res).to.eq(expectedUrl);
            done();
          })
        });
      });

      describe("site without og:image", function(){
        var url = "http://google.com"
          , expectedUrl = "http://google.com/images/srpr/logo9w.png";
        it("should return the correct url", function(done){
          LinkPost.getPreviewPhotoUrl(url, function(err, res){
            if (err) return done(err);
            expect(res).to.eq(expectedUrl);
            done();
          })
        });
      });
    });
  });

});
