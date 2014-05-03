var client       = require('./redis_client')
  , util         = require('util')
  , EventEmitter = require('events').EventEmitter
  , helper       = require('../lib/global_helpers')
  , getObjectID  = helper.getObjectID;

var BASE_SCORE = 1
  , POST_CREATED_SCORE = BASE_SCORE
  , POST_RELAYED_SCORE = BASE_SCORE*5;

var EventsMonitor = function(){
  EventEmitter.call(this);

  this.keys = {
    popularPosts: "manager:popular_posts",
    post: function(post){
      return "manager:" + getObjectID(post);
    }
  };

  /* Events on userRelayedPost */
  this.on("userRelayedPost", function(err, user, post){
    // Update `popular_posts`
    client.zincrby(this.keys.popularPosts, POST_RELAYED_SCORE, getObjectID(post), function(err, reply){
      if (err) throw err;
    });
  });

  /* Events on userCreatedPost */
  this.on("userCreatedPost", function(err, user, post){
    // Update `popular_posts`
    client.zincrby(this.keys.popularPosts, POST_CREATED_SCORE, getObjectID(post), function(err, reply){
      if (err) throw err;
    });
  });
};

util.inherits(EventsMonitor, EventEmitter);
module.exports = new EventsMonitor();
