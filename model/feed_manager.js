var client                = require('./redis_client')
  , key                   = require('./redis_key')
  , FeedItem              = require('./feed_item')
  , helpers               = require('../lib/global_helpers')
  , getObjectID           = helpers.getObjectID
  , eqObjectIDs           = helpers.eqObjectIDs
  , UserConnectionManager = require('./user_connection_manager')
  , socialSettings        = require('../config').socialSettings;

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

  /**
   * Gets user's feed.
   */
  getUserFeedPosts: function(user, callback){
    var self = this;
    self.getUserFeedItems(user, function(err, feedItems){
      if (err) return callback(err, null);

      var postIDs = Object.keys(feedItems);
      var Post = require('mongoose').model('Post');
      // Get posts from MongoDB
      Post.findByIds(postIDs, null, function(err, dbPosts){
        if (err) return callback(err, null);

        // Get all senders (user objects)
        self.getAllFeedItemSenders(feedItems, function(err, senders){
          if (err) return callback(err, null);

          // Assign each post.feedItem and complete relayer (user obj)
          for(var i = dbPosts.length-1; i >= 0; i--){
            var pid = dbPosts[i].id
              , item = feedItems[pid];
            dbPosts[i].feedItem = item;
            dbPosts[i].relayer  = senders[item.senderID.toString()];
          }
          return callback(null, dbPosts.sort(self.dbPostsCompareFn));
        });
      });
    });
  },

  // Sort by feedItem score, lowest to highest
  dbPostsCompareFn: function(a, b){
    return a.feedItem.score - b.feedItem.score;
  },

  // Get an associative array of feedItem senders
  getAllFeedItemSenders: function(feedItems, done){
    // Get sender Ids
    var senderIDs = [];
    if (feedItems instanceof Array)
      feedItems.forEach(function(item){ senderIDs.push(item.senderID); });
    else {
      for(var prop in feedItems) {
        var item = feedItems[prop];
        if (!item instanceof FeedItem) continue;
        senderIDs.push(item.senderID);
      }
    }

    // Grab all users from MongoDB
    var User = require('mongoose').model('User');
    User.find( {'_id': {'$in': senderIDs} }, function(err, users){
      if (err) done(err, null);

      // Construct associative array with users
      var senders = {};
      users.forEach(function(user){ senders[user.id] = user; });
      done(null, senders);
    });
  },

  /**
   * Returns the highest feedItem score
   * Lower is higher rank
   * If no feedItems, returns MIN_POST_SCORE
   */
  getHighestRankScoreInUserFeed: function(user, done){
    var offset = 0
      , count  = 1
      , args   = [ this.userFeedKey(user),
                   '+inf',
                   '-inf',
                   'WITHSCORES',
                   'LIMIT',
                   offset,
                   count];

    client.ZRANGEBYSCORE(args, function(err, res){
      if (err) return done(err, null);
      // result => [id, score, id, ...]
      var score = res[1] || socialSettings.MIN_POST_SCORE;
      done(null, Number(score) );
    });
  },

  // Available options: WITHSCORES
  getUserFeedPostIDs: function(user, done, options){
    options = options || {};
    var args = [this.userFeedKey(user), 0, -1];
    if (options.WITHSCORES) args.push('WITHSCORES');
    client.zrange(args, done);
  },

  /**
   * Returns a associative array of feedItems
   * Index is the postId
   */
  getUserFeedItems: function(user, done){
    var self = this;

    var feedItems = {};
    // Get PostIDs with scores
    // result => [id, score, id, ...]
    this.getUserFeedPostIDs(user, function(err, idsAndScores){
      if (err) return done(err, null);

      // Build multi transaction to get the hash for all feedItems
      var commands = [];
      var length = idsAndScores.length
      for(var i = 0; i < length; i += 2) {
        var pid    = idsAndScores[i]
          , score = idsAndScores[i+1];

        feedItems[pid] = { score: score };
        var args = ['HGETALL', self.userFeedItemKey(user, pid)];
        commands.push(args);
      }

      client.multi(commands).exec(function(err, replies){
        if (err) return done(err, null);

        // Assign each reply to its feedItem
        for(var j = 0; j < length; j += 2) {
          var pid   = idsAndScores[j]
            , reply = replies[Math.floor(j/2)];
          feedItems[pid] = new FeedItem({
            postID         : pid,
            relayed        : reply.relayed,
            senderID       : reply.sender,
            prevSenderID   : reply.prevSender,
            originDistance : reply.origin_dist,
            score          : feedItems[pid].score
          });
        }

        done(null, feedItems);
      });
    }, {WITHSCORES: true});
  },

  getUserFeedItem: function(userID, postID, callback){
    var self = this;
    userID = getObjectID(userID);
    postID = getObjectID(postID);
    client.HGETALL(self.userFeedItemKey(userID, postID), function(err, res){
      if (err)  return callback(err, null);
      if (!res) return callback(null, null);

      client.ZSCORE(self.userFeedKey(userID), postID, function(err, score){
        if (err)  return callback(err, null);
        var feedItem = new FeedItem({
          postID         : postID,
          relayed        : res.relayed,
          senderID       : res.sender,
          prevSenderID   : res.prevSender,
          originDistance : res.origin_dist,
          score          : score
        });
        callback(null, feedItem);
      })
    });
  },

  addPostToUserFeed: function(post, user, done){
    var FeedManager = this
      , userID = getObjectID(user);

    if(!userID) return done(new Error("Requires a valid user or user id"), null);
    // Get the highest ranked feedItem score
    // This feed item must be the currently highest ranked item on the user's feed
    FeedManager.getHighestRankScoreInUserFeed(user, function(err, score){
      if (err) return done(err, null);

      var feedItem = new FeedItem({
        postID         : getObjectID(post),
        relayed        : true,
        senderID       : userID,
        prevSenderID   : userID,
        score          : Math.max(score-socialSettings.ADJ_POST_SCORE, socialSettings.MIN_POST_SCORE)
      });

      // Save to feed
      client
        .multi(FeedManager.__addFeedItemCommands(userID, feedItem))
        .exec(function(err, res){
          if (err) return done(err, null);
          done(null, feedItem);
        });
    });
  },

  sendItemToConnections: function(feedItem, connections, callback){
    var self = this;
    var count = connections.length;
    var commands = [];

    // Builds a multi redis transaction for each connection.
    for(var i=count-1; i>=0; i--){
      var connection = connections[i];
      // Adjust feedItem for each connection
      //
      // Set feedItem score to connection distance
      var currentItem = feedItem;
      currentItem.score = connection.distance;
      commands = commands.concat(self.__addFeedItemCommands(connection.target, currentItem));
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
      senderID       : getObjectID(sender),
      prevSenderID   : getObjectID(sender)
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
        postID         : getObjectID(post),
        senderID       : getObjectID(user),
        prevSenderID   : (prevItem) ? prevItem.senderID : getObjectID(user),
        originDistance : (prevItem) ? prevItem.originDistance+1 : socialSettings.MIN_CONNECTION_DISTANCE
      });

      // 1. Send item to connections
      self.sendItemToConnections(feedItem, connections, function(err, res){
        if (err) return callback(err, null);

        // 2. Connect user to prevSender of prevItem
        // Dist = distTo sender + dist between sender and prevSender
        var sender = prevItem.senderID;
        var prevSender = prevItem.prevSenderID;
        // If no prevItem or user is sender, we can stop here.
        if (!prevItem || eqObjectIDs(user, sender)) return callback(null, res);

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

