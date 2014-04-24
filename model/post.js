var mongoose  = require('mongoose'),
    ObjectId  = mongoose.Types.ObjectId,
    Schema    = mongoose.Schema,
    client    = require('redis').createClient(),
    redis_key = require('./redis_key'),
    User      = require('mongoose').model('User');

var postSchema = Schema({
  _author: {type: Schema.Types.ObjectId, ref: 'User', required: true}
});

// Note: Temp const.  This will change later in the project.
var DEFAULT_POST_SCORE = 10;

postSchema.methods.updateAuthorConnectedFeeds = function(author){
  var post = this;
  if (post._author.toString() != author._id.toString()) throw err;
  /*** Get author's connections ***/
  author.getConnections(function(err, connections){
    /*** Add post to each feed ***/
    var transaction = client.multi();
    var otherUserId = null;
    var feedKey = null;
    for(var i = connections.length - 1; i >= 0; i--){
      otherUserId = connections[i].target;
      feedKey = User.feedKeyForID(otherUserId);
      transaction.zadd(feedKey, DEFAULT_POST_SCORE, post._id);
    }
    transaction.exec(function(err, replies){
      if (err) throw err;
      post.emit("updatedConnectedFeeds");
    });
  });
};

/***** Static Model Methods *****/
postSchema.statics.createPostByUser = function(user, attrs, callback){
  /*** Save Post ***/
  var newPost = new Post(attrs);
  newPost._author = user;
  newPost.save(function(err){
    if (err) return callback(err, null);
    /*** Add to Author's posts ***/
    User.addPost(user, newPost, function(err, post, user){
      if (err) return callback(err, null);
      callback(null, post);
      newPost.updateAuthorConnectedFeeds(user);
    });
  });
  return newPost;
};


var Post = mongoose.model('Post', postSchema);

