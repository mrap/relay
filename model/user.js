var redis                 = require('redis')
  , client                = redis.createClient()
  , key                   = require('./redis_key')
  , mongoose              = require('mongoose')
  , Schema                = mongoose.Schema
  , UserConnectionManager = require('./user_connection_manager')
  , UserConnection        = require('./user_connection')
  , ObjectId              = mongoose.Types.ObjectId
  , bcrypt                = require('bcrypt')
  , FeedManager           = require('./feed_manager');

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

userSchema.methods.connectWithUser = function(distance, other, callback){
  UserConnectionManager.connectUsers(this, other, distance, callback);
};

userSchema.methods.getFeedPostIds = function(callback){
  FeedManager.getUserFeedPosts(this, false, callback);
};

userSchema.methods.getConnectionsCount = function(callback){
  UserConnectionManager.getUserConnectionsCount(this, callback);
};

userSchema.methods.isValidPassword = function(data, callback){
  matchesHash(data, this.password, callback);
};

userSchema.methods.getConnections = function(callback){
  UserConnectionManager.getUserConnections(this, callback);
};

userSchema.methods.relayOwnPost = function(post, callback){
  var user = this;
  user.getConnections(function(err, connections){
    if (err) return callback(err, null);
    FeedManager.sendNewPostToConnections(user, post, connections, function(err, res){
      if (err) return callback(err, null);
      callback(null, res);
    });
  });
};

/***** Static Model Methods *****/
userSchema.statics.connectUsers = function(user1, user2, distance, callback){
  UserConnectionManager.connectUsers(user1, user2, distance, callback);
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
  User.findById(id, function(err, user){
    if (err) return callback(err, null, null);
    if (user.posts.indexOf(post._id) !== -1) return callback(new Error("User already has post: " + post), null, null);
    user.posts.push(post._id);
    user.save(function(err){
      if (err) return callback(err, null, null);
      post._author = user;
      user.relayOwnPost(post, function(err, res){
        if (err) return callback(err, null);
        callback(null, post, user);
      })
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

