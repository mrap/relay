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

  createUser: function(attrs, callback){
    attrs = this.ensureRequiredAttrs(attrs);
    
    var user = User.createUser(attrs);
    user.once("created", function(){
      callback(null, user);
    });
  },

  createUsers: function(userCount, attrs, callback){
    var self = this;
    attrs = self.ensureRequiredAttrs(attrs);
    users = [];
    function createAnother(current){
      if (current == userCount) return callback(null, users);
      self.createUser(attrs, function(err, user){
        users.push(user);
        return createAnother(current+1);
      });
    }
    createAnother(0);
  },

  createUserWithConnections: function(connectionsCount, connectionDist, userAttrs, callback){
    var self = this;

    /** Create user **/
    self.createUser(userAttrs, function(err, user){
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

