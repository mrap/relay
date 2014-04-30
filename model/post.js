var mongoose      = require('mongoose')
  , ObjectId      = mongoose.Types.ObjectId
  , Schema        = mongoose.Schema
  , redis_key     = require('./redis_key')
  , User          = mongoose.model('User')
  , EventsMonitor = require('./events_monitor')
  , client        = require('./redis_client')
  , helpers       = require('../lib/global_helpers')
  , getObjectID   = helpers.getObjectID;

var postSchema = Schema({
  _author:          { type: Schema.Types.ObjectId, ref: 'User', required: true, select: false },
  _last_relayed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  relay_count:      { type: Number, default: 0, select: false },
  content:          { type: String }
});

// Note: Temp const.  This will change later in the project.
var DEFAULT_POST_SCORE = 10;

/***** Static Model Methods *****/
postSchema.statics.createByUser = function(attrs, user, callback){
  /*** Save Post ***/
  var newPost = new this(attrs);
  newPost._author = user;
  newPost._last_relayed_by = user;
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
  if (options.WITH_AUTHOR) query.select('+_author').populate('_author');
  if (options.WITH_LAST_RELAYED_BY) query.populate('_last_relayed_by');
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
    Post.findByIds(postIds, {WITH_LAST_RELAYER: true}, next);
  });
};

mongoose.model('Post', postSchema);

