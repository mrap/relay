var redis                 = require('redis')
  , client                = redis.createClient()
  , key                   = require('./redis_key')
  , FeedItem              = require('./feed_item')
  , getObjectID           = require('../lib/global_helpers').getObjectID
  , UserConnectionManager = require('./user_connection_manager');

// Redis fields
var FIELD = {
  SENDER : "sender",
  PREV_SENDER : "prev_sender",
  ORIGIN_DIST : "origin_dist"
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

  getUserFeedPosts: function(user, withScores, callback){
    var userID = getObjectID(user);
    var args = [this.userFeedKey(userID), 0, -1];
    if (withScores) args.push('WITHSCORES');
    client.zrange(args, function(err, res){
      if (err) throw err;
      callback(null, res);
    });
  },

  getUserFeedItem: function(userID, postID, callback){
    userID = getObjectID(userID);
    postID = getObjectID(postID);
    client.hgetall(this.userFeedItemKey(userID, postID), function(err, res){
      if (err)  return callback(err, null);
      if (!res) return callback(null, null);
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
      commands = commands.concat(this.__addFeedItemCommands(connection.target, feedItem));
    } client.multi(commands).exec(function(err, res) {
      if (err) return callback(err, null);

      // "Relaxes" feedItem's distance
      // Guarantees the shortest origin_distance is set
      function updateAnother(current){
        if (current >= count) return callback(null, connections);
        var connection = connections[current];
        self.updateFeedItemDistance(connection.target, feedItem, function(err, dist){
          if (err) return callback(err, null);
          return updateAnother(current+1);
        });
      }
      return updateAnother(0);
    });
  },

  sendNewPostToConnections: function(sender, post, connections, callback){
    var feedItem = new FeedItem({
      postID         : getObjectID(post),
      senderID       : getObjectID(sender)
    });
    this.sendItemToConnections(feedItem, connections, callback);
  },

  sendExistingPostToConnections: function(user, post, connections, callback){
    var self = this;
    // Get post's feedItem from user's feed
    // Configure a new feedItem to send to connections
    self.getUserFeedItem(user, post, function(err, prevItem){
      if (err) return callback(err, null);
      // If no item exists, user doesn't have the post in their feed, short circuit
      if (!prevItem) return callback(new Error("User does not have post in their feed!"), null);
      var feedItem = new FeedItem({
        postID         : getObjectID(post),
        senderID       : getObjectID(user),
        prevSenderID   : prevItem.senderID,
        originDistance : prevItem.originDistance+1
      });

      // 1. Send item to connections
      self.sendItemToConnections(feedItem, connections, function(err, res){
        if (err) return callback(err, null);

        // 2. Connect user to prevSender of prevItem
        // Dist = distTo sender + dist between sender and prevSender
        var sender = prevItem.senderID;
        var prevSender = prevItem.prevSenderID;
        UserConnectionManager.getDistanceBetweenUsers(user, sender, function(err, distToSender){
          UserConnectionManager.getDistanceBetweenUsers(sender, prevSender, function(err, distSenderToPrevSender){
            var dist = distToSender + distSenderToPrevSender;
            UserConnectionManager.connectUsers(user, prevSender, dist, function(err, res){

              // 3. Intimate connection between user and sender
              UserConnectionManager.intimateUsers(user, sender, callback);
            });
          });
        });
      });
    });
  }
};

module.exports = FeedManager;

