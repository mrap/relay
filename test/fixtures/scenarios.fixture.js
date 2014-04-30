var mongoose    = require('mongoose')
  , PostFixture = require('./posts.fixture')
  , Factory     = require('../factories');

// Each connected user will be x distance away from base user.
// Each connected user will post exactly once.
module.exports.UserWithConnectionsAndFeed = function(userAttrs, connectionsCount, next){
  /*** Setup ***/
  Factory.create('User', userAttrs, function(err, user){
    if (err) return next(err, null);

    function createConnectedUser(current){
      if (current === 0) return next(null, user);

      // Create the other user
      Factory.create('User', function(err, other){
        if (err) return next(err, null);
        // Connect with base user
        user.connectWithUser(current, other, function(err, connection){
          if (err) return next(err, null);
          // Other user create a post
          PostFixture.createByUser(null, other, function(err, post){
            if (err) return next(err, null);
          });
          createConnectedUser(current-1);
        });
      });
    }
    createConnectedUser(connectionsCount);
  });
};
