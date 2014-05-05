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
