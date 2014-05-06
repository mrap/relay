var mongoose = require('mongoose')
  , Post     = mongoose.model('Post')
  , LinkPost = mongoose.model('link_post')
  , Factory = require('../factories');

var Fixture = {
  createByUserWithType: function(attrs, user, type, next){
    type = type || 'Post';
    var Model = Post;
    if (type == 'link_post') Model = LinkPost;

    Factory.build(type, attrs, function(err, attrs){
      if (err) return next(err, null);
      if (user) return Model.createByUser(attrs, user, next);
      Factory.create('User', function(err, newUser){
        if (err) return next(err, null);
        Model.createByUser(attrs, newUser, next);
      });
    });
  }
};

module.exports = Fixture;
