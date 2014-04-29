var mongoose      = require('mongoose')
  , ObjectId      = mongoose.Types.ObjectId
  , Schema        = mongoose.Schema
  , redis_key     = require('./redis_key')
  , User          = mongoose.model('User')
  , EventsMonitor = require('./events_monitor')
  , client        = require('./redis_client');

var postSchema = Schema({
  _author:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  _last_relayed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  content:          { type: String }
});

// Note: Temp const.  This will change later in the project.
var DEFAULT_POST_SCORE = 10;

postSchema.methods.getLastRelayerID = function(next){
  client.HGET(EventsMonitor.keys.post(this), "last_relayed_by", next);
};

postSchema.methods.getLastRelayer = function(next){
  this.getLastRelayerID(function(err, id){
    if (err) throw err;
    User.findById(id, next);
  });
};

/***** Static Model Methods *****/
postSchema.statics.createByUser = function(attrs, user, callback){
  /*** Save Post ***/
  var newPost = new this(attrs);
  newPost._author = user;
  newPost.save(function(err){
    if (err) return callback(err, null);
    /*** Add to Author's posts ***/
    User.addPost(user, newPost, function(err, post, user){
      if (err) return callback(err, null);
      callback(null, post);
    });
  });
  return newPost;
};

postSchema.statics.findByIds = function(ids, options, next){
  var Post = this;
  if (!ids || ids.length === 0) return next(null, []);
  var query = Post.find({'_id': {'$in': ids}});
  if (options.WITH_AUTHOR) query.populate('_author');
  query.exec(next);
};

postSchema.statics.getPopularPosts = function(first, last, next){
  var Post = this;
  var startIndex = first;
  var endIndex   = first + last;
  var args = [EventsMonitor.keys.popularPosts, first, endIndex];
  client.zrevrange(args, function(err, postIds){
    if (err) return next(err, null);
    var i = postIds.length;
    while(i--) {
      if (postIds[i] === 'null') postIds.splice(i, 1);
      else postIds[i] = getObjectID(postIds[i]);
    }
    Post.findByIds(postIds, {WITH_AUTHOR: true}, next);
  });
};

mongoose.model('Post', postSchema);

