var mongoose = require('mongoose')
var User = require('./user')
var postSchema = mongoose.Schema({
});
var Post = mongoose.model('Post', postSchema);

exports.createPost = function(user_id, attrs, callback){
  if (!user_id) return callback(new Error("user_id required to create a post"), null);
  User.userExists(user_id, function(err, exists){
    if (!exists) return callback(err, null)
    var newPost = new Post(attrs);
    // Save post to Mongo
    newPost.save(function(err, res){
      if (err) return callback(err, res)
      callback(err, newPost)
    })
  })
}
