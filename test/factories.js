var UserSchema     = require('../model/user')
  , PostSchema     = require('../model/post')
  , LinkPostSchema = require('../model/link_post')
  , mongoose       = require('mongoose')
  , Monky          = require('monky')
  , monky          = new Monky(mongoose);

monky.factory('User', {
  email:    'user#n@email.com',
  password: "pass",
  username: "username#n"
});

monky.factory('Post', {
  _author: 'User',
  content: "This is content"
});

monky.factory('link_post', {
  _author: 'User',
  content: "This is content",
  link: "http://awesome-link.com"
});

module.exports = monky;
