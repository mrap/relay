var redis      = require('redis')
  , client     = redis.createClient()
  , key        = require('./redis_key')
  , mongoose   = require('mongoose')
  , Schema     = mongoose.Schema
  , Connection = require('./connection')
  , ObjectId   = mongoose.Types.ObjectId
  , bcrypt     = require('bcrypt');

/*** Encryption ***/
var generateHash = function(data, callback){
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(data, salt, function(err, hash) {
      callback(err, hash);
    });
  });
};

var matchesHash = function(data, hash, callback){
  bcrypt.compare(data, hash, callback);
};

/***** Schema *****/
var userSchema = Schema({
  posts     : [{type: Schema.Types.ObjectId, ref: 'Post'}],
  email     : { type: String, required: true, unique: true},
  password  : { type: String, required: true }
});

userSchema.pre('save', function(next){
  var user = this;
  if (!user.needsEncryption) return next();
  generateHash(user.password, function(err, hash){
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

userSchema.post('save', function(user){
  user._needsEncryption = false;
});

userSchema.virtual('needsEncryption').set(function(b){
  this._needsEncryption = b;
});

userSchema.virtual('needsEncryption').get(function(){
  if (typeof this._needsEncryption !== 'undefined') return this._needsEncryption;
  else {
    this._needsEncryption = true;
    return this._needsEncryption;
  }
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
      if (err) console.error(err);
      callback(err, new Connection(user._id, other._id, distance));
    });
};

userSchema.methods.getFeedPostIds = function(callback){
  var user = this;
  var args = [user.keyID("feed"), 0, -1, 'WITHSCORES'];
  client.zrange(args, function(err, res){
    if (err) throw err;
    callback(null, res);
  });
};

/**
 * Returns number of user's connections to other users.
 */
userSchema.methods.getConnectionsCount = function(callback){
  client.zcard(this.keyID("connections"), function(err, count){
    if (err) throw err;
    callback(err, count);
  });
};

userSchema.methods.isValidPassword = function(data, callback){
  matchesHash(data, this.password, callback);
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
    var length = res.length;
    var otherID = null;
    var distance = null;
    for(var i = 0; i < length; i += 2){
      otherID = new ObjectId(res[i]);
      distance = res[i+1];
      connections.push(new Connection(user._id, otherID, distance));
    }
    callback(null, connections);
  });
};

/***** Static Model Methods *****/
userSchema.statics.connectUsers = function(users, distance, callback){
  if (!(users instanceof Array) || users.length != 2)
    return callback(new Error("Needs two users to connect"), null);
  var user1 = users[0];
  var user2 = users[1];
  user1.connectWithUser(distance, user2, function(err, connection){
    callback(null, connection);
  });
};

userSchema.statics.getConnectedUsers = function(user, callback){
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

userSchema.statics.feedKeyForID = function(id){
  return key.keyIDAttribute("user", id.toString(), "feed" );
};


/**
 * Adds a post to a user's posts.
 * callback returns (error, post, user)
 */
userSchema.statics.addPost = function(id, post, callback){
  User.findById(id, function(err, res){
    if (err) return callback(err, null, null);
    var user = res;
    if (user.posts.indexOf(post._id) !== -1) return callback(new Error("User already has post: " + post), null, null);
    user.posts.push(post._id);
    user.save(function(err){
      if (err) return callback(err, null, null);
      post._author = user;
      callback(null, post, user);
    });
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

