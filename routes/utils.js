'use strict'

var express     = require('express')
  , router      = express.Router()
  , mongoose = require('mongoose')
  , LinkPost = mongoose.model('link_post');

router.get('/getImageUrl', function(req, res){
  LinkPost.getPreviewPhotoUrl(req.query.url, function(err, imageUrl){
    if (err) return res.json(500, { error: err} );
    res.json({ url: decodeURIComponent(imageUrl) });
  });
});

module.exports = router;
