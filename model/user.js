var redis    = require('redis');
var client   = redis.createClient();
var key      = require('./redis_key')
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var userSchema = Schema({
  posts: [{type: Schema.Types.ObjectId, ref: 'Post'}]
});
var User = mongoose.model('User', userSchema);

User.createUser = function(attrs, callback){
  var newUser = new User(attrs)
  newUser.save(function(err, res){
    if (err) return callback(err, res)
    callback(err, newUser)
  })
}

User.connectUsers = function(users, distance, callback){
  if (!(users instanceof Array) || users.length != 2)
    return callback(new Error("Needs two users to connect"), null);
  var id1 = users[0]._id;
  var id2 = users[1]._id;
  var key1 = key.keyIDAttribute("user", id1, "connections");
  var key2 = key.keyIDAttribute("user", id2, "connections");
  client.multi()
    .zadd(key1, distance, id2)
    .zadd(key2, distance, id1)
    .exec(function(err, replies){
      if (err) throw err;
      callback(null, distance);
    });
};

module.exports = User;
