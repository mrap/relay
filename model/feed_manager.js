var client                = require('./redis_client')
  , key                   = require('./redis_key')
  , FeedItem              = require('./feed_item')
  , getObjectID           = require('../lib/global_helpers').getObjectID
  , UserConnectionManager = require('./user_connection_manager');

// Redis fields
var FIELD = {
  SENDER      : "sender",
  PREV_SENDER : "prev_sender",
  ORIGIN_DIST : "origin_dist",
  RELAYED     : "relayed"
};

var FeedManager = {
  // Chainable Redis commands
  // Prefixed with `__`
  __addFeedItemScore: function(userID, feedItem, score){
    score = score || feedItem.score;
    return ["zadd", this.userFeedKey(userID), score, feedItem.postID];
  },

  __addFeedItem: function(userID, feedItem){
    var hash = {};
    hash[FIELD.RELAYED] = feedItem.relayed;
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

  isAttributeUpdatable: function(attribute) {
    if (typeof attribute !== 'string') throw new Error("Attribute must be a string");
    var upperCased = attribute.toUpperCase();
    return upperCased === 'SCORE' || FIELD.hasOwnProperty(upperCased);
  },

  updateUserPostFeedItemAttributeValue: function(user, post, attribute, value, done){
    var self = this
      , userID = getObjectID(user)
      , postID = getObjectID(post);
    if (!userID)                               return done(new Error("Requires user"), null);
    if (!postID)                               return done(new Error("Requires post"), null);
    if (!self.isAttributeUpdatable(attribute)) return done(new Error("%s is not an updatable attribute"), null);

    // Uppercase attribute to make it easier to work with FIELD
    attribute = attribute.toUpperCase();

    self.getUserFeedItem(user, post, function(err, feedItem){
      if (err)       return done(err, null);
      if (!feedItem) return done(new Error("Cannot update feedItem: user's feed doesn't contain item for post: %s", post), null);

      // Update feedItem
      // Uses Redis multi commands for convenience only.
      // We already have prewritten transactions, might as well use them.
      //
      // If 'score', update item's score in feed's sorted set
      if (attribute === 'SCORE') {
        var newScore = Number(value)
        if (!newScore) return done(new Error("Cannot update feedItem's score with value: %s", value), null);
        client.multi([self.__addFeedItemScore(user, feedItem, newScore)]).exec( function(err, replies){
          if (err) return done(err, null);
          feedItem.score = newScore;
          // Return updated feedItem
          done(null, feedItem);
        });
      }

      // Else, update item's hash field
      else {
        var prop = FIELD[attribute];
        feedItem[prop] = value;
        client.multi([self.__addFeedItem(user, feedItem)]).exec( function(err, replies){
          if (err) return done(err, null);
          // Return updated feedItem
          done(null, feedItem);
        });
      }
    });
  },

  userFeedKey: function(userID){
    userID = getObjectID(userID);
    return key.keyIDAttribute("user", userID.toString(), "feeditems" );
  },

  userFeedItemKey: function(user, item){
    var userID = getObjectID(user)
      , itemID = getObjectID(item);

    return "user"+":"+userID+":"+"feeditem"+":"+itemID;
  },

  userFeedHasItem: function(userID, itemID, callback){
    client.exists(this.userFeedItemKey(userID, itemID), callback);
  },

  getUserFeedPosts: function(user, callback, options){
    var self = this;
    var key = this.userFeedKey(user);
    options = options || {};
    this.getFeedPostIDsForKey(key, function(err, postIDs){
      if (err) return callback(err, null);
      if (options.IDS_ONLY) return callback(null, postIDs);

      // Get posts from MongoDB
      Post.findByIds(postIDs, null, function(err, dbPosts){
        if (err) return callback(err, null);

        // Assign each post.feedItem
        function assignFeedItem(itr){
          if (itr === dbPosts.length) return callback(null, dbPosts);
          self.getUserFeedItem(user, dbPosts[itr], function(err, feedItem){
            if (err) return callback(err, null);
            dbPosts[itr].feedItem = feedItem;
            assignFeedItem(itr+1);
          });
        }
        assignFeedItem(0);
      });
    });
  },

  getFeedPostIDsForKey: function(key, callback){
    var self = this;
    var args = [key, 0, -1];
    client.zrange(args, callback);
  },

  getUserFeedItem: function(userID, postID, callback){
    userID = getObjectID(userID);
    postID = getObjectID(postID);
    client.hgetall(this.userFeedItemKey(userID, postID), function(err, res){
      if (err)  return callback(err, null);
      if (!res) return callback(null, null);
      var feedItem = new FeedItem({
          postID         : postID,
          relayed        : res.relayed,
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
      relayed        : true,
      postID         : getObjectID(post),
      senderID       : getObjectID(sender)
    });
    this.sendItemToConnections(feedItem, connections, callback);
  },

  sendExistingPostToConnections: function(user, post, connections, callback, isStrict){
    var self = this;
    // Get post's feedItem from user's feed
    // Configure a new feedItem to send to connections
    self.getUserFeedItem(user, post, function(err, prevItem){
      if (err) return callback(err, null);
      // If no item exists, user doesn't have the post in their feed, short circuit
      if (isStrict && !prevItem) return callback(new Error("User does not have post in their feed!"), null);
      var feedItem = new FeedItem({
        relayed        : true,
        postID         : getObjectID(post),
        senderID       : getObjectID(user),
        prevSenderID   : (prevItem) ? prevItem.senderID : getObjectID(user),
        originDistance : (prevItem) ? prevItem.originDistance+1 : 1
      });

      // 1. Send item to connections
      self.sendItemToConnections(feedItem, connections, function(err, res){
        if (err) return callback(err, null);
        // If no prevItem, we can stop here.
        if (!prevItem) return callback(null, res);

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

