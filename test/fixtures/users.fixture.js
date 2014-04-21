var User = require('../../model/user');

var Fixture = {
  requiredAttrs: function(){
    return {};
  },

  ensureRequiredAttrs: function(attrs){
    for (a in this.requiredAttrs) 
      if (!attrs.hasOwnProperty(a)) attrs[a] = this.requiredAttrs[a];
    return attrs || {};
  },

  createUser: function(attrs, callback){
    attrs = this.ensureRequiredAttrs(attrs);
    User.createUser(attrs, callback);
  },

  createUsers: function(userCount, attrs, callback){
    var self = this;
    attrs = self.ensureRequiredAttrs(attrs);
    users = [];
    function createAnother(current){
      if (current >= userCount) return callback(null, users);
      self.createUser(attrs, function(err, user){
        if (err) throw err;
        users.push(user);
        return createAnother(current+1);
      });
    }
    return createAnother(0);
  },

  createUserWithConnections: function(connectionsCount, connectionDist, userAttrs, callback){
    var self = this;

    /** Create user **/
    var user = null;
    self.createUser(userAttrs, function(err, res){
      user = res;

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

