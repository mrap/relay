'use strict'

var express  = require('express')
  , router   = express.Router()
  , mongoose = require('mongoose')
  , Post     = mongoose.model('Post')
  , LinkPost = mongoose.model('link_post')
  , User     = mongoose.model('User')
  , _        = require('underscore');

var VALID_POST_ATTRS = ['_author', 'headline', 'link'];

var filterPostAttrs = function(attrs){
  return _.pick(attrs, VALID_POST_ATTRS);
};

/* GET popular posts */
router.get('/popular', function(req, res) {
  Post.getPopularPosts(0, 20, function(err, posts){
    if (err) throw err;
    res.json(posts);
  });
});

/* POST create a post */
router.post('/', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);

  var type      = req.body.post_type ? req.body.post_type.toLowerCase() : 'post'
    , Model     = Post
    , postAttrs = filterPostAttrs(req.body)
    , authorID  = req.user.id;

  // Use the right Post model type
  if (type === 'link_post' || type === 'linkpost') Model = LinkPost;

  Model.createByUser(postAttrs, authorID, function(err, post){
    if (err) throw err;
    res.json(post);

    // Update the link_posts preview_photo_url if it doesn't yet have one
    if (Model === LinkPost && !post.preview_photo_url) {
      Model.updatePostPreviewPhotoUrl(post, function(err){
        if (err) throw err;
      });
    }
  });
});

/* POST #relay */
router.post('/:id/relay', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);

  var relayerID = req.body.relayer || null
  if (!relayerID) throw new Error("Needs param `relayer`");

  User.findById(relayerID, function(err, user){
    if (err)   throw err;
    if (!user) throw new Error("User with id:%s does not exist!", relayerID);
    user.relayOtherPost(req.params.id, function(err, post){
      if (err) throw err;
      res.json(post);
    });
  });
});

router.post('/:id/unrelay', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);

  var relayerID = req.body.relayer || null
  if (!relayerID) throw new Error("Needs param `relayer`");

  User.findById(relayerID, function(err, user){
    if (err)   throw err;
    if (!user) throw new Error("User with id:%s does not exist!", relayerID);
    user.unrelayPost(req.params.id, function(err, post){
      if (err) throw err;
      res.send(200);
    });
  });
});

module.exports = router;
