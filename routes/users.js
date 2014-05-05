'use strict'

var express     = require('express')
  , router      = express.Router()
  , FeedManager = require('../model/feed_manager');

router.get('/:id/feed', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);
  FeedManager.getUserFeedPosts(req.params.id, function(err, feed){
    if (err) throw err;
    res.json(feed);
  });
});

module.exports = router;
