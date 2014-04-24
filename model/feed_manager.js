var redis = require('redis')
  , client = redis.createClient()
  , key = require('./redis_key');

var getObjectID = function(obj){
  if      (obj === null) return null;
  else if (obj.constructor.name === 'ObjectID') return obj;
  else if (obj._id.constructor.name === 'ObjectID') return obj._id;
  else    return null;
};

var FeedManager = {
  /*** Chainable Redis commands ***/
  // Prefixed with `__`
  __addFeedItemWithScore: function(userID, itemID, score){
    return ["zadd", this.userFeedKey(userID), score, itemID];
  },

  __addFeedItemSender: function(userID, itemID, senderID){
    return ["hset", this.userFeedItemKey(userID, itemID), "origin", senderID];
  },

  __addFeedItemPrevSender: function(userID, itemID, senderID){
    return ["hset", this.userFeedItemKey(userID, itemID), "prev", senderID];
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
  sendItemToConnections: function(itemID, connections, senderID, prevSenderID, callback){
    itemID       = getObjectID(itemID);
    senderID     = getObjectID(senderID);
    prevSenderID = getObjectID(prevSenderID);
    if (itemID === null || senderID === null) callback(new Error("Requires itemID("+itemID+") and senderID("+senderID+")"), null);
    var count = connections.length;
    var commands = [];
    for(var i=count-1; i>=0; i--){
      var connection = connections[i];
      commands.push(this.__addFeedItemWithScore(connection.target, itemID, connection.distance));
      commands.push(this.__addFeedItemSender(connection.target, itemID, senderID));
      if (prevSenderID) commands.push(this.__addFeedItemWithScore(connection.target, itemID, connection.distance));
    }
    client.multi(commands).exec(callback);
  }
};

module.exports = FeedManager;

