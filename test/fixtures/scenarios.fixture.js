var mongoose    = require('mongoose')
  , PostFixture = require('./posts.fixture')
  , Factory     = require('../factories');

// Each connected user will be x distance away from base user. (performs in descending order)
// Each connected user will post exactly once.
module.exports.UserWithConnectionsAndFeed = function(userAttrs, connectionsCount, next){
  /*** Setup ***/
  Factory.create('User', userAttrs, function(err, user){
    if (err) return next(err, null, null);

    // Collect otherUsers and posts as they're created
    var extra = {
      otherUsers: [],
      posts: []
    };

    function createConnectedUser(current){
      if (current === 0) return next(null, user, extra);

      // Create the other user
      Factory.create('User', function(err, other){
        if (err) return next(err, null, null);
        // Connect with base user
        user.connectWithUser(current, other, function(err, connection){
          if (err) return next(err, null, null);

          // Every 'even' user posts a media post.
          var postAttrs = {
            is_media: current % 2 === 0
          };

          // Other user create a post
          PostFixture.createByUserWithType(postAttrs, other, 'link_post', function(err, post){
            if (err) return next(err, null, null);
            extra.otherUsers.push(other);
            extra.posts.push(post);
          });
          createConnectedUser(current-1);
        });
      });
    }
    createConnectedUser(connectionsCount);
  });
};
