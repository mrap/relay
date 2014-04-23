var User = require('../../model/user');

var Fixture = {
  requiredAttrs: function(){
    return { password: "a-very-secure-password" };
  },

  ensureRequiredAttrs: function(attrs){
    attrs = attrs || {};
    for (a in this.requiredAttrs())
      if (typeof attrs[a] === 'undefined') {
        attrs[a] = this.requiredAttrs()[a];
      }
    return attrs;
  },

  createUser: function(attrs){
    attrs = this.ensureRequiredAttrs(attrs);
    return User.createUser(attrs);
  },

  createUsers: function(userCount, attrs, callback){
    var self = this;
    attrs = self.ensureRequiredAttrs(attrs);
    users = [];
    function createAnother(current){
      if (current == userCount) return callback(null, users);
      var user = self.createUser(attrs);
      user.once("created", function(){
        users.push(user);
        return createAnother(current+1);
      });
    }
    createAnother(0);
  },

  createUserWithConnections: function(connectionsCount, connectionDist, userAttrs, callback){
    var self = this;

    /** Create user **/
    var user = self.createUser(userAttrs);
    user.once("created", function(){
      /** Create Other Users **/
      self.createUsers(connectionsCount, null, function(err, users){

        /** Create Connections **/
        function createAnother(current){
          if (current >= users.length) return callback(null, user);
          var otherUser = users[current]
          User.connectUsers([user, otherUser], connectionDist, function(err, res){
            if (err) throw err;
            return createAnother(current+1);
          });
        }
        return createAnother(0);
      })
    });
  }
};

module.exports = Fixture;

