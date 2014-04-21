var Post = require('../../model/post');
var UserFixture = require('./users.fixture');

var Fixture = {
  requiredAttrs: function() {
    return {};
  },

  ensureRequiredAttrs: function(attrs){
    for (a in this.requiredAttrs)
      if (typeof attrs[a] === 'undefined') attrs[a] = this.requiredAttrs[a];
    return attrs || {};
  },

  createPost: function(attrs, callback){
    attrs = this.ensureRequiredAttrs(attrs)
    // If _author present create a post
    var post = new Post();
    if (typeof attrs._author !== 'undefined') {
      var post = Post.createPost(attrs);
      post.once("created", function(){
        callback(null, post);
      });
    } else {
      var user = UserFixture.createUser(null);
      user.on("created", function(){
        attrs._author = user._id;
        var post = Post.createPost(attrs);
        post.once("created", function(){
          callback(null, post);
        });
      });
    }
  }
}

module.exports = Fixture;
