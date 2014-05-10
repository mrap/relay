'use strict'

var express     = require('express')
  , router      = express.Router()
  , mongoose = require('mongoose')
  , LinkPost = mongoose.model('link_post');

router.get('/getImageUrl', function(req, res){
  LinkPost.getPreviewPhotoUrl(req.query.url, function(err, imageUrl){
    if (err) throw err;
    res.json({ url: imageUrl });
  });
});

module.exports = router;
