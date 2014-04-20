var mongoose = require('mongoose')
var userSchema = mongoose.Schema({
});
var User = mongoose.model('User', userSchema);

exports.createUser = function(attrs, callback){
  var newUser = new User(attrs)
  // Save user to Mongo
  newUser.save(function(err, res){
    if (err) return callback(err, res)
    callback(err, newUser)
  })
}

exports.userExists = function(id, callback){
  if (!id) return callback(new Error("user_id required"), false);
  User.findById(id, function(err, user){
    callback(err, user != null);
  });
}
