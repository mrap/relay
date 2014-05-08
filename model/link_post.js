var PostSchema  = require('./post')
  , mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  , extend      = require('mongoose-schema-extend')
  , helpers     = require('../lib/global_helpers')
  , getObjectID = helpers.getObjectID;

var LinkPostSchema = PostSchema.extend({
  link:              { type: String, required: true },
  is_media:          { type: Boolean, default: false },
  preview_photo_url: { type: String }
});

LinkPostSchema.statics.getPreviewPhotoUrl = function(url, done) {
  var request = require('request')
    , cheerio = require('cheerio');

  request(url, function(err, res, body){
    if (err) return done(err, null);
    $ = cheerio.load(body);

    // Check for open graph image
    var openGraphImageUrl = $('meta[property="og:image"]').attr('content');
    if (openGraphImageUrl) return done(null, openGraphImageUrl);

    // Check for images
    var largestImage = null;
    var images = $('img').each(function(i, elem){
      if (!largestImage || elem.attribs.width > largestImage.attribs.width)
        largestImage = elem;
    });

    if (largestImage) {
      var imageUrl = url + largestImage.attribs.src;
      return done(null, imageUrl);
    }

    done(null, null);
  });
};

LinkPostSchema.statics.updatePostPreviewPhotoUrl = function(post, done) {
  var Model = this;

  // Ensure post is a post object
  if (!post instanceof Model) {
    var id = getObjectID(post);
    Model.findById(id, function(err, res){
      if (err) return done(err);
      Model.setPostPreviewPhotoUrl(res, done);
    });
    return;
  }

  Model.getPreviewPhotoUrl(post.link, function(err, photoUrl){
    if (err) return done(err);
    Model.findByIdAndUpdate(post.id,{ preview_photo_url: photoUrl }, function(err, res){
      if (err) return done(err);
      post.preview_photo_url = photoUrl;
      done(null, post);
    });
  });
};

mongoose.model('link_post', LinkPostSchema);

module.exports = LinkPostSchema;
