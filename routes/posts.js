var express = require('express');
var router = express.Router();
var Post = require('mongoose').model('Post');

/* GET popular posts. */
router.get('/popular', function(req, res) {
  Post.getPopularPosts(0, 20, function(err, posts){
    if (err) throw err;
    res.json(posts);
  });
});

module.exports = router;
