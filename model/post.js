var mongoose      = require('mongoose')
  , ObjectId      = mongoose.Types.ObjectId
  , Schema        = mongoose.Schema
  , redis_key     = require('./redis_key')
  , User          = require('mongoose').model('User')
  , EventsMonitor = require('./events_monitor');

var postSchema = Schema({
  _author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String }
});

// Note: Temp const.  This will change later in the project.
var DEFAULT_POST_SCORE = 10;

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

mongoose.model('Post', postSchema);

