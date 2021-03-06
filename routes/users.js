'use strict'

var express     = require('express')
  , router      = express.Router()
  , mongoose    = require('mongoose')
  , User        = mongoose.model('User')
  , FeedManager = require('../model/feed_manager')
  , _           = require('underscore')
  , passport    = require('../config/passport')
  , formidable = require('formidable');

var VALID_ATTRS = [
  'email',
  'username',
  'password'
];

var filterAttrs = function(attrs){
  return _.pick(attrs, VALID_ATTRS);
};

router.get('/:id/feed', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);
  FeedManager.getUserFeedPosts(req.params.id, function(err, feed){
    if (err) throw err;
    res.json(feed);
  });
});

router.post('/', function(req, res){
  var user = new User(filterAttrs(req.body));

  // Save
  user.save(function(err){
    if (err) return res.json(500, {error: err});

    // Grab from db
    // TODO: skip fetch from db and prune the user obj manually here
    User.findById(user.id, function(err, u){
      if (err) return res.json(500, {error: err});
      
      // Authenticate user
      passport.authenticate('local-signup')(req, res, function(){
        res.json(u);
      });
    });
  });
});

router.post('/:id/avatar', function(req, res){
  if (!req.isAuthenticated()) return res.send(401);

  User.findById(req.params.id, function(err, user){
    if (err) return res.json(500, {error: err});
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
      user.attach('avatar', files.avatar, function(err){
        if (err) throw err;
        user.save(function(err){
          if (err) throw err;
          res.json(user);
        });
      });
    });
  });
});

module.exports = router;
