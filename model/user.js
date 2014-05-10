var key                   = require('./redis_key')
  , mongoose              = require('mongoose')
  , attachments           = require('mongoose-attachments')
  , Schema                = mongoose.Schema
  , UserConnectionManager = require('./user_connection_manager')
  , UserConnection        = require('./user_connection')
  , ObjectId              = mongoose.Types.ObjectId
  , bcrypt                = require('bcrypt')
  , FeedManager           = require('./feed_manager')
  , EventsMonitor         = require('./events_monitor')
  , config                = require('../config')
  , helpers               = require('../lib/global_helpers')
  , getObjectID           = helpers.getObjectID;

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
  username  : { type: String, required: true, unique: true},
  password  : { type: String, required: true, select: false }
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

userSchema.pre('init', function(next){
  this._needsEncryption = false;
  next();
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

/*** Attachments ***/
userSchema.plugin(attachments, {
  directory: 'users',
  storage: {
    providerName: 's3',
    options: {
      key    : config.s3.key,
      secret : config.s3.secret,
      bucket : config.s3.bucket
    }
  },
  properties: {
    avatar: {
      styles: {
        medium: {
          resize: '150x150',
          '$format': 'jpg'
        },
        small: {
          resize: '75x75',
          '$format': 'jpg'
        },
        tiny: {
          resize: '42x42',
          '$format': 'jpg'
        }
      }
    }
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

var INITIAL_CONNECTION_DISTANCE = 10;
userSchema.methods.connectWithUser = function(distance, other, callback){
  UserConnectionManager.connectUsers(this, other, distance, callback);
};

userSchema.methods.getFeedPostIds = function(callback){
  FeedManager.getUserFeedPostIDs(this, callback);
};

userSchema.methods.getConnectionsCount = function(callback){
  UserConnectionManager.getUserConnectionsCount(this, callback);
};

userSchema.methods.isValidPassword = function(data, callback){
  if (!this.password) return callback(new Error("isValidPassword requires a user object with .password field"), false);
  matchesHash(data, this.password, callback);
};

userSchema.methods.getConnections = function(callback){
  UserConnectionManager.getUserConnections(this, callback);
};

userSchema.methods.getDistanceToUser = function(other, callback){
  UserConnectionManager.getDistanceBetweenUsers(this, other, callback);
};

userSchema.methods.isConnectedToUser = function(other, callback){
  UserConnectionManager.areUsersConnected(this, other, callback);
};

userSchema.methods.relayOwnPost = function(post, next){
  var user = this;
  user.getConnections(function(err, connections){
    if (err) return next(err, null);
    FeedManager.sendNewPostToConnections(user, post, connections, function(err, res){
      if (err) return next(err, null);
      FeedManager.addPostToUserFeed(post, user, function(err, res){
        if (err) return next(err, null);
        next(null, post);
        EventsMonitor.emit("userCreatedPost", null, user, post);
      });
    });
  });
};

userSchema.methods.relayOtherPost = function(post, next){
  var user = this;

  // Ensure post is a model instance, else go grab it from the db
  if (post.constructor.name !== 'model') {
    var Post = mongoose.model('Post');
    return Post.findById(post, function(err, p){
      if (err) return next(err, null);
      user.relayOtherPost(p, next);
    });
  };

  // TODO: Refactor this logic into FeedManager (event-driven code)
  // 1. Mark as 'relayed'
  FeedManager.updateUserPostFeedItemAttributeValue(user, post, 'relayed', true, function(err, res){
    if (err) return done(err, null);

    // 1. Send post to connections
    user.getConnections(function(err, connections){
      if (err) return next(err, null);
      FeedManager.sendExistingPostToConnections(user, post, connections, function(err, res){
        if (err) return next(err, null);

        // 2. Update post's '_last_relayed_by' field
        post.update({_last_relayed_by: user, $inc: {__relay_count: 1} }, function(err, res){
          if (err) return next(err, null);
          next(null, post);
        });
        EventsMonitor.emit("userRelayedPost", null, user, post);
      });
    });
  });
};

/**
 * Marks feedItem.relayed as false
 *
 * TODO: Completely reverse all changes as they were before relay.
 * This might require a transaction stack of some sort.
 */
userSchema.methods.unrelayPost = function(post, done){
  var user = this;

  if (post.constructor.name !== 'model') {
    var Post = mongoose.model('Post');
    return Post.findById(post, function(err, p){
      if (err) return next(err, null);
      user.unrelayPost(p, done);
    });
  };

  FeedManager.updateUserPostFeedItemAttributeValue(user, post, 'relayed', false, function(err, res){
    if (err) return done(err, null);
    done(null, res);
  });
};

/***** Static Model Methods *****/

userSchema.statics.createAndRelayPosts = function(attrs, posts, done){
  var User = this;
  // Create user
  var user = new User(attrs);
  user.save(function(err){
    if (err) return done(err, null);

    var Post = mongoose.model('Post'); // require Post here to avoid circular dependency
    Post.findByIds(posts, {WITH_LAST_RELAYED_BY: true}, function(err, dbPosts){
      if (err) return done(err, user);

      // Connect with each last relayer and relay the post
      function connectWithAnother(itr){
        if (itr === dbPosts.length) return done(null, user);

        // 1. Connect last relayer with user
        // Last relayer must be the origin of the connection
        var currentPost = dbPosts[itr];
        var lastRelayer = currentPost._last_relayed_by;
        lastRelayer.connectWithUser(INITIAL_CONNECTION_DISTANCE, user, function(err, connection){
          if (err) return done(err, user);

          // 2. Insert post into user's feed
          FeedManager.sendExistingPostToConnections(lastRelayer, currentPost, [connection], function(err, res){
            if (err) return done(err, user);
            // 3. User relay post
            user.relayOtherPost(posts[itr], function(err, res){
              if (err) return done(err, user);
              // 4. Do the next post
              connectWithAnother(itr+1);
            });
          });
        });
      }
      connectWithAnother(0);
    });
  });
};

userSchema.statics.connectUsers = function(user1, user2, distance, callback){
  UserConnectionManager.connectUsers(user1, user2, distance, callback);
};

userSchema.statics.getConnectedUsers = function(user, callback){
  var model = this;
  user.getConnections(function(err, connections){
    // Extract an array of the connected user's ids
    var ids  = new Array();
    for(var i = 0; i < connections.length; i++) ids.push(connections[i].target);
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
  id = getObjectID(id);
  this.findById(id).exec( function(err, user){
    if (err) return callback(err, null, null);
    if (!user) return callback(new Error("User with id "+id+" does not exist."), null, null);
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

