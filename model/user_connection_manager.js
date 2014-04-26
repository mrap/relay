var UserConnection = require('./user_connection')
  , redis          = require('redis')
  , client         = redis.createClient()
  , getObjectID    = require('../lib/global_helpers.js').getObjectID;


var UserConnectionManager = {

  userConnectionsKey: function(user){
    var id = getObjectID(user);
    return "user"+":"+id.toString()+":connections";
  },

  /**
   * Connects two users
   * Connections are reflexive (applies to both users)
   * Overwrites previous connection
   * @param distance integer  cannot be less than 0
   * @param other    user     cannot be self
   * @param callback callback returns distance
   */
  connectUsers: function(user1, user2, distance, callback){
    var self = this;
    var uid1 = getObjectID(user1);
    var uid2 = getObjectID(user2);
    client.multi()
    .zadd(self.userConnectionsKey(uid1), distance, uid2)
    .zadd(self.userConnectionsKey(uid2), distance, uid1)
    .exec(function(err, replies){
      if (err) return callback(err, null);
      callback(err, new UserConnection(uid1, uid2, distance));
    });
  },

  getUserConnectionsCount: function(user, callback){
    client.zcard(this.userConnectionsKey(user), function(err, count){
      if (err) return callback(err, null);
      callback(null, count);
    });
  },

  /**
   * Returns the connection distance between two users.
   * If they are not connected, callback returns -1.
   */
  getDistanceBetweenUsers: function(user1, user2, callback){
    if (typeof callback !== 'function') return callback(new Error("3rd param must be a callback function"), null);
    var uid2 = getObjectID(user2);
    client.zscore(this.userConnectionsKey(user1), uid2, function(err, res){
      if (err) return callback(err, null);
      res = Number(res) || -1; 
      callback(null, res);
    });
  },

  /**
   * Returns an array of user's connections.
   */
  getUserConnections: function(user, callback){
    var args = [this.userConnectionsKey(user), 0, -1, 'WITHSCORES'];
    client.zrange(args, function(err, reply){
      if (err) return callback(err, null);
      var connections = new Array();
      var length = reply.length;
      for(var i = 0; i < length; i += 2){
        var otherID = getObjectID(reply[i]);
        var distance = reply[i+1];
        connections.push(new UserConnection(user._id, otherID, distance));
      }
      callback(null, connections);
    });
  }
};

module.exports = UserConnectionManager;
