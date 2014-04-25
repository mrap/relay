var redis = require('redis')
  , client = redis.createClient()
  , key = require('./redis_key');

// Add another array's items to an array (Fastest implementation)
// Source: http://stackoverflow.com/questions/4156101/javascript-push-array-values-into-another-array
Array.prototype.pushArray = function() {
  var toPush = this.concat.apply([], arguments);
  for (var i = 0, len = toPush.length; i < len; ++i) {
    this.push(toPush[i]);
  }
};

var getObjectID = function(obj){
  if      (obj === null) return null;
  else if (obj.constructor.name === 'ObjectID') return obj;
  else if (obj._id.constructor.name === 'ObjectID') return obj._id;
  else    return null;
};

var FeedManager = {
  /*** Chainable Redis commands ***/
  // Prefixed with `__`
  __addFeedItemScore: function(userID, feedItem){
    return ["zadd", this.userFeedKey(userID), feedItem.score, feedItem.postID];
  },

  __addFeedItem: function(userID, feedItem){
    var hash = {};
    // Check to avoid storing null values (wastes space)
    if (feedItem.senderID)      hash["sender"]      = feedItem.senderID;
    if (feedItem.prevSenderID)  hash["prev_sender"] = feedItem.prevSenderID;
    return ["hmset", this.userFeedItemKey(userID, feedItem.postID), hash];
  },

  __incrFeedItemDistance: function(userID, feedItem){
    var distance = feedItem.originDistance+1;
    return ["hincrby", this.userFeedItemKey(userID, feedItem.postID), "origin_dist", distance];
  },

  __addFeedItemCommands: function(userID, feedItem){
    return [ this.__addFeedItemScore(userID, feedItem),
             this.__addFeedItem(userID, feedItem),
             this.__incrFeedItemDistance(userID, feedItem)];
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

  // 1. Store to user's feeditems Sorted List:
  //    user:userID:feeditems => [ itemID : score, itemID : score, ... ]
  // 2. Store senderID and prevSenderID in hash
  //    user:userID:feeditem  => { origin : senderID, prev: prevSenderID }
  sendItemToConnections: function(feedItem, connections, callback){
    var count = connections.length;
    var commands = [];
    for(var i=count-1; i>=0; i--){
      var connection = connections[i];
      commands.pushArray(this.__addFeedItemCommands(connection.target, feedItem));
    }
    client.multi(commands).exec(callback);
  }
};

module.exports = FeedManager;

