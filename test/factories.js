require('../model/user');
require('../model/post');
var mongoose = require('mongoose')
  , Monky    = require('monky')
  , monky    = new Monky(mongoose);


monky.factory('User', {
  email: 'user#n@email.com',
  password: "very secure password"
});

monky.factory('Post', {
  _author: 'User'
});

module.exports = monky;
