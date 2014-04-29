var client       = require('./redis_client')
  , util         = require('util')
  , EventEmitter = require('events').EventEmitter
  , helper       = require('../lib/global_helpers')
  , getObjectID  = helper.getObjectID;

var BASE_SCORE = 1
  , POST_CREATED_SCORE = BASE_SCORE
  , POST_RELAYED_SCORE = BASE_SCORE*5;

var EventsMonitor = function(){
  this.keys = {
    popularPosts: "manager:popularPosts",
    post: function(post){
      return "manager:" + getObjectID(post);
    }
  };

  EventEmitter.call(this);
  this.on("userRelayedPost", function(err, user, post){
    client.zincrby(this.keys.popularPosts, POST_RELAYED_SCORE, getObjectID(post), function(err, reply){
      if (err) throw err;
    });
    client.hset(this.keys.post(post), 'last_relayed_by', getObjectID(user), function(err, reply){
      if (err) throw err;
    });
  });
  this.on("userCreatedPost", function(err, user, post){
    client.zincrby(this.keys.popularPosts, POST_CREATED_SCORE, getObjectID(post), function(err, reply){
      if (err) throw err;
    });
    client.hset(this.keys.post(post), 'last_relayed_by', getObjectID(user), function(err, reply){
      if (err) throw err;
    });
  });
};

util.inherits(EventsMonitor, EventEmitter);
module.exports = new EventsMonitor();
