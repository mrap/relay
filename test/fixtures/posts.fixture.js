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
    if (typeof attrs._author !== 'undefined') {
      Post.createPost(attrs, function(err, res){
        if (err) throw err;
        return callback(null, res);
      });
    } else {
      UserFixture.createUser(null, function(err, user){
        attrs._author = user._id;
        Post.createPost(attrs, function(err, res){
          if (err) throw err;
          return callback(null, res);
        });
      });
    }
  }
}

module.exports = Fixture;
