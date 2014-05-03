'use strict'

var express  = require('express')
  , router   = express.Router()
  , mongoose = require('mongoose')
  , Post     = mongoose.model('Post')
  , User     = mongoose.model('User');

/* GET popular posts */
router.get('/popular', function(req, res) {
  Post.getPopularPosts(0, 20, function(err, posts){
    if (err) throw err;
    res.json(posts);
  });
});

/* POST #relay */
router.post('/:id/relay', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);
  User.findById(req.body.relayer, function(err, user){
    if (err) throw err;
    user.relayOtherPost(req.params.id, function(err, post){
      if (err) throw err;
      res.json(post);
    });
  });
});

module.exports = router;
