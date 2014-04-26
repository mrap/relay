require('../model/user');
require('../model/post');
var mongoose = require('mongoose')
  , Monky    = require('monky')
  , monky    = new Monky(mongoose);

monky.factory('User', {
  email:    'user#n@email.com',
  password: "very secure password",
  username: "username#n"
},
function(err){
  if (err) throw err;
});

monky.factory('Post', {
  _author: 'User'
}, function(err){
  if (err) throw err;
});

module.exports = monky;
