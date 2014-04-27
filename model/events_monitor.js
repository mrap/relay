var redis        = require('redis')
  , client       = redis.createClient()
  , util         = require('util')
  , EventEmitter = require('events').EventEmitter
  , helper       = require('../lib/global_helpers')
  , getObjectID  = helper.getObjectID;

var EventsMonitor = function(){
  this.KEYS = {
    TOP_LATEST_POSTS: "manager:top_latest_posts"
  };

  EventEmitter.call(this);
  this.on("userRelayedPost", function(err, user, post){
    client.zincrby(this.KEYS.TOP_LATEST_POSTS, 1, getObjectID(post), function(err, reply){
      if (err) throw err;
    });
  });
};

util.inherits(EventsMonitor, EventEmitter);
module.exports = new EventsMonitor();
