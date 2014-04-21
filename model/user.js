var redis    = require('redis');
var client   = redis.createClient();
var key      = require('./redis_key')
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Connection = require('./connection');
var ObjectId = mongoose.Types.ObjectId;

/***** Schema *****/
var userSchema = Schema({
  posts: [{type: Schema.Types.ObjectId, ref: 'Post'}]
});

/**
 * Returns a Redis Key ID for a User with the optional attribute
 * Without attribute: "user:53546a356f87fc0000c5236f"
 * With 'foo' attribute: "user:53546a356f87fc0000c5236f:foo"
 */
userSchema.methods.keyID = function(attr) {
  if (attr) return key.keyIDAttribute("user", this._id, attr);
  else      return key.keyID("user", this._id);
};

/**
 * Connects user with another.
 * Connections are reflexive (applies to both users)
 * Overwrites previous connection
 * @param distance integer  cannot be less than 0
 * @param other    user     cannot be self
 * @param callback callback returns distance
 */
userSchema.methods.connectWithUser = function(distance, other, callback){
  var user = this;
  client.multi()
    .zadd(user.keyID("connections"), distance, other._id)
    .zadd(other.keyID("connections"), distance, user._id)
    .exec(function(err, replies){
      if (err) throw err;
      callback(null, new Connection(user._id, other._id, distance));
    });
};

userSchema.methods.getFeed = function(callback){
  var args = [user.keyID("feed"), 0, -1, 'WITHSCORES'];
  client.zrange(args, function(err, res){
  });
};

/**
 * Returns number of user's connections to other users.
 */
userSchema.methods.getConnectionsCount = function(callback){
  client.zcard(this.keyID("connections"), function(err, count){
    if (err) throw err;
    callback(null, count);
  });
};

/**
 * Returns an array of user's connections.
 */
userSchema.methods.getConnections = function(callback){
  var user = this;
  var args = [user.keyID("connections"), 0, -1, 'WITHSCORES'];
  client.zrange(args, function(err, res){
    if (err) throw err;
    var connections = new Array();
    var length = res.length
    var otherID = null;
    var distance = null;
    for(var i = 0; i < length; i += 2){
      otherID = new ObjectId(res[i]);
      distance = res[i+1];
      connections.push(new Connection(user._id, otherID, distance));
    }
    callback(err, connections);
  });
};

/***** Compile User Model with Schema *****/
var User = mongoose.model('User', userSchema);

Array.prototype.containsUser = function(user){
  for (var i = this.length-1; i >= 0; i--) {
    if ('undefined' !== typeof this[i]['prop']) continue;
    if (this[i]._id.toString() == user._id.toString()) return true;
  }
  return false;
};

User.createUser = function(attrs, callback){
  var newUser = new User(attrs)
  newUser.save(function(err, res){
    if (err) return callback(err, res)
    callback(err, newUser)
  })
}

User.connectUsers = function(users, distance, callback){
  if (!(users instanceof Array) || users.length != 2)
    return callback(new Error("Needs two users to connect"), null);
  var user1 = users[0];
  var user2 = users[1];
  user1.connectWithUser(distance, user2, callback);
};

User.getConnectedUsers = function(user, callback){
  var model = this;
  user.getConnections(function(err, connections){
    // Extract an array of the connected user's ids
    var ids  = new Array();
    for(var i = 0; i < connections.length; i++)
      ids.push(connections[i].target);
    model.find({'_id': {'$in': ids}}, function(err, res){
      if (err) throw err;
      callback(null, res);
    });
  });
};


module.exports = User;
