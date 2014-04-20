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

module.exports = User;
