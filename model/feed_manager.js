var redis    = require('redis')
  , client   = redis.createClient()
  , key      = require('./redis_key')
  , FeedItem = require('./feed_item');

// Redis fields
var FIELD = {
  SENDER : "sender",
  PREV_SENDER : "prev_sender",
  ORIGIN_DIST : "origin_dist"
};

var getObjectID = function(obj){
  if      (obj === null) return null;
  else if (obj.constructor.name === 'ObjectID') return obj;
  else if (obj._id.constructor.name === 'ObjectID') return obj._id;
  else    return null;
};

var FeedManager = {
  // Chainable Redis commands
  // Prefixed with `__`
  __addFeedItemScore: function(userID, feedItem){
    return ["zadd", this.userFeedKey(userID), feedItem.score, feedItem.postID];
  },

  __addFeedItem: function(userID, feedItem){
    var hash = {};
    // Check to avoid storing null values (wastes space)
    if (feedItem.senderID)      hash[FIELD.SENDER]      = feedItem.senderID;
    if (feedItem.prevSenderID)  hash[FIELD.PREV_SENDER] = feedItem.prevSenderID;
    return ["hmset", this.userFeedItemKey(userID, feedItem.postID), hash];
  },

  __incrFeedItemDistance: function(userID, feedItem){
    var distance = feedItem.originDistance+1;
    return ["hincrby", this.userFeedItemKey(userID, feedItem.postID), FIELD.ORIGIN_DIST, distance];
  },

  __addFeedItemCommands: function(userID, feedItem){
    return [ this.__addFeedItemScore(userID, feedItem),
             this.__addFeedItem(userID, feedItem)];
  },

  /**
   * Gets the item
   * updates it's distance value if the previous value is greater
   */
  updateFeedItemDistance: function(userID, feedItem, callback){
    userID = getObjectID(userID);
    var dist = feedItem.originDistance;
    var key = this.userFeedItemKey(userID, feedItem.postID);
    client.hget(key, FIELD.ORIGIN_DIST, function(err, reply){
      if (err) return callback(err, null);
      var prevDist = reply || Number.POSITIVE_INFINITY;
      if (prevDist <= dist) return callback(null, prevDist);
      client.hset(key, FIELD.ORIGIN_DIST, dist, function(err, reply){
        if (err) return callback(err, null);
        callback(null, dist);
      });
    });
  },

  userFeedKey: function(userID){
    return key.keyIDAttribute("user", userID.toString(), "feeditems" );
  },

  userFeedItemKey: function(userID, itemID){
    return "user"+":"+userID.toString()+":"+"feeditem"+":"+itemID.toString();
  },

  userFeedHasItem: function(userID, itemID, callback){
    client.exists(this.userFeedItemKey(userID, itemID), callback);
  },

  getUserFeedItem: function(userID, postID, callback){
    userID = getObjectID(userID);
    postID = getObjectID(postID);
    client.hgetall(this.userFeedItemKey(userID, postID), function(err, res){
      if (err) return callback(err, null);
      var feedItem = new FeedItem({
          postID         : postID,
          senderID       : res.sender,
          prevSenderID   : res.prevSender,
          originDistance : res.origin_dist });
      callback(null, feedItem);
    });
  },

  sendItemToConnections: function(feedItem, connections, callback){
    var self = this;
    var count = connections.length;
    var commands = [];

    // Builds a multi redis transaction for each connection.
    for(var i=count-1; i>=0; i--){
      var connection = connections[i];
      commands.pushArray(this.__addFeedItemCommands(connection.target, feedItem));
    } client.multi(commands).exec(function(err, res) {
      if (err) return callback(err, null);

      // "Relaxes" feedItem's distance
      // Guarantees the shortest origin_distance is set
      function updateAnother(current){
        if (current >= count) return callback(null, count);
        var connection = connections[current];
        self.updateFeedItemDistance(connection.target, feedItem, function(err, dist){
          if (err) return callback(err, null);
          return updateAnother(current+1);
        });
      }
      return updateAnother(0);
    });
  }
};

module.exports = FeedManager;

