var Factory = require('../factories');

var Fixture = {
  createUserWithConnections: function(userAttrs, connectionsCount, connectionDist, callback){
    /** Create user **/
    Factory.create('User', userAttrs, function(err, user){
      if (err) return callback(err, null);
      /** Create Other Users **/
      Factory.createList('User', connectionsCount, function(err, users){

        /** Create Connections **/
        function createAnother(current){
          if (current >= users.length) return callback(null, user);
          var otherUser = users[current]
          user.connectWithUser(connectionDist, otherUser, function(err, res){
            if (err) return callback(err, null);
            return createAnother(current+1);
          });
        }
        return createAnother(0);
      });
    });
  }
};

module.exports = Fixture;

