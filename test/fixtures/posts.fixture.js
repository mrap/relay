var mongoose = require('mongoose')
  , Post = mongoose.model('Post')
  , Factory = require('../factories')

var Fixture = {
  createByUser: function(attrs, user, next){
    Factory.build('Post', function(err, postAttrs){
      if (err) return next(err, null);
      if (user) return Post.createByUser(postAttrs, user, next);
      Factory.create('User', function(err, newUser){
        if (err) return next(err, null);
        Post.createByUser(postAttrs, newUser, next);
      });
    });
  }
}

module.exports = Fixture;
