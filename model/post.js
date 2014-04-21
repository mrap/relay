var mongoose  = require('mongoose'),
    Schema    = mongoose.Schema,
    client    = require('redis').createClient(),
    redis_key = require('./redis_key');
var User = require('./user')
var postSchema = Schema({
  _author: {type: Schema.Types.ObjectId, ref: 'User', required: true}
});

// Note: Temp const.  This will change later in the project.
var DEFAULT_POST_SCORE = 10;

postSchema.methods.updateConnectedFeeds = function(){
  var post = this;
  /*** Get author's connections ***/
  post.author.getConnections(function(err, connections){
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

postSchema.methods.assignAuthor = function(){
  var post = this;
  /*** Add to Author's Posts ***/
  User.findById(post._author, 'posts' , function(err, res){
    if (err) throw err;
    var author = res;
    author.posts.push(post._id);
    author.save(function(err){
      if (err) throw err;
      post.author = new User(author);
      post.emit("assignedAuthor", post.author);
    });
  });
};

var Post = mongoose.model('Post', postSchema);

Post.createPost = function(attrs){
  /*** Save Post ***/
  var newPost = new Post(attrs);
  newPost.once("new", newPost.assignAuthor);
  newPost.once("assignedAuthor", newPost.updateConnectedFeeds);
  newPost.once("updatedConnectedFeeds", function(){
    newPost.emit("created");
  });
  newPost.on("updatedConnectedFeeds", function(){
    newPost.emit("saved");
  })

  newPost.save(function(err){ 
    if (err) throw err; 
    newPost.emit("new");
  });

  return newPost;
};

module.exports = Post;