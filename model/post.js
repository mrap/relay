var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;
var User = require('./user')
var postSchema = Schema({
  _author: {type: Schema.Types.ObjectId, ref: 'User', required: true}
});
var Post = mongoose.model('Post', postSchema);

exports.createPost = function(attrs, callback){
  var newPost = new Post(attrs);
  newPost.save(function(err){
    if (err) throw err;
    User.findById(newPost._author, 'posts' , function(err, res){
      if (err) throw err;
      var author = res;
      author.posts.push(newPost._id);
      author.save(function(err){
        if (err) throw err;
        callback(null, newPost)
      });
    })
  })
}
