var UserConnection = require('./user_connection')
  , client         = require('./redis_client')
  , helpers        = require('../lib/global_helpers.js')
  , getObjectID    = helpers.getObjectID
  , eqObjectIDs    = helpers.eqObjectIDs;

var USERS_NOT_CONNECTED = -1
  , MIN_DISTANCE        = 1
  , DEFAULT_DISTANCE    = 10;

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
    distance = distance || DEFAULT_DISTANCE;
    self.getDistanceBetweenUsers(user1, user2, function(err, prevDist){
      if (err) return callback(err, null);
      if (prevDist !== USERS_NOT_CONNECTED) return callback(null, new UserConnection(user1, user2, prevDist));
      var uid1 = getObjectID(user1);
      var uid2 = getObjectID(user2);
      client.multi()
      .zadd(self.userConnectionsKey(uid1), distance, uid2)
      .zadd(self.userConnectionsKey(uid2), distance, uid1)
      .exec(function(err, replies){
        if (err) return callback(err, null);
        callback(err, new UserConnection(uid1, uid2, distance));
      });
    });
  },

  getUserConnectionsCount: function(user, callback){
    client.zcard(this.userConnectionsKey(user), function(err, count){
      if (err) return callback(err, null);
      callback(null, count);
    });
  },

  areUsersConnected: function(user1, user2, callback){
    this.getDistanceBetweenUsers(user1, user2, function(err, res){
      if (err) return callback(err, false);
      callback(null, res !== USERS_NOT_CONNECTED);
    });
  },

  /**
   * Returns the connection distance between two users.
   * If they are not connected, callback returns -1.
   */
  getDistanceBetweenUsers: function(user1, user2, callback){
    if (typeof callback !== 'function') return callback(new Error("3rd param must be a callback function"), null);
    var uid1  = getObjectID(user1);
    var uid2  = getObjectID(user2);
    if (uid1 === uid2) return callback(null, 0);
    client.zscore(this.userConnectionsKey(uid1), uid2, function(err, res){
      if (err) return callback(err, null);
      res = Number(res) || USERS_NOT_CONNECTED;
      callback(null, res);
    });
  },

  /**
   * Returns an array of user's connections.
   */
  getUserConnections: function(user, callback){
    user = getObjectID(user);
    var args = [this.userConnectionsKey(user), 0, -1, 'WITHSCORES'];
    client.zrange(args, function(err, reply){
      if (err) return callback(err, null);
      var connections = new Array();
      var length      = reply.length;
      for(var i = 0; i < length; i += 2){
        var otherID = getObjectID(reply[i]);
        var distance = reply[i+1];
        connections.push(new UserConnection(user, otherID, distance));
      }
      callback(null, connections);
    });
  },

  incrementDistanceToConnections: function(amount, connections, callback){
    var self = this;
    amount = Math.max(amount, MIN_DISTANCE);
    if (!connections || connections.length == 0) return callback(null, []);
    // Increment/Decrement connection distance
    var trans = client.multi();
    for (var i = connections.length-1; i >= 0; i--){
      var connection = connections[i];
      trans.zincrby(self.userConnectionsKey(connection.origin), amount, connection.target);
      connections[i].distance = connection.distance+amount;
    } trans.exec(function(err, replies){
      if (err) return callback(err, null);
      callback(null, connections)
    });
  },

  /**
   * Shortens  distance between two users.
   * Lengthens distance of all other connections of each user.
   */
  intimateUsers: function(user1, user2, callback){
    var self = this;
    if (eqObjectIDs(user1, user2)) return callback(new Error("Can't intimate the user to itself."), null);
    var uid1 = getObjectID(user1)
      , uid2 = getObjectID(user2);

    // Get current distance between users
    self.getDistanceBetweenUsers(uid1, uid2, function(err, distBetween){
      // Get number of connections for both users
      client.multi()
      .zcard(self.userConnectionsKey(uid1))
      .zcard(self.userConnectionsKey(uid2))
      .exec(function(err, replies){
        if (err) return callback(err, null);
        distBetween          = Math.max(distBetween, MIN_DISTANCE);
        var connectionCount1 = Math.max(replies[0], 1) // avoid divide by 0
          , connectionCount2 = Math.max(replies[1], 1)
          , distDiff1        = Math.max(distBetween / connectionCount1, MIN_DISTANCE)
          , distDiff2        = Math.max(distBetween / connectionCount2, MIN_DISTANCE);

        // Get ALL connections and increment them
        self.getUserConnections(uid1, function(err, connections1){
          if (err) return callback(err, null);
          self.incrementDistanceToConnections(distDiff1/connectionCount1, connections1, function(err, res){
            if (err) return callback(err, null);
            self.getUserConnections(uid2, function(err, connections2){
              if (err) return callback(err, null);
              self.incrementDistanceToConnections(distDiff2/connectionCount2, connections2, function(err, res){
                if (err) return callback(err, null);
                // Multiply diff by 2
                // Reason: previous operations lengthen ALL user's connections
                // This is how we make up for it
                client.multi()
                  .zincrby(self.userConnectionsKey(uid1), -(distDiff1*2), uid2)
                  .zincrby(self.userConnectionsKey(uid2), -(distDiff2*2), uid1)
                  .exec(function(err, replies){
                    callback(null, true);
                  });
              });
            });
          });
        });
      });
    });
  }
};

module.exports = UserConnectionManager;
