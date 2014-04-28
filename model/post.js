var mongoose      = require('mongoose')
  , ObjectId      = mongoose.Types.ObjectId
  , Schema        = mongoose.Schema
  , redis_key     = require('./redis_key')
  , User          = require('mongoose').model('User')
  , EventsMonitor = require('./events_monitor');

var postSchema = Schema({
  _author: {type: Schema.Types.ObjectId, ref: 'User', required: true}
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
      EventsMonitor.emit("userCreatedPost", user, post);
      callback(null, post);
    });
  });
  return newPost;
};

postSchema.statics.findByIds = function(ids, next){
  if (!ids || ids.length === 0) return next(null, []);
  this.find({'_id': {'$in': ids}}, function(err, res){
    if (err) throw err;
    next(null, res);
  });
};

var Post = mongoose.model('Post', postSchema);

