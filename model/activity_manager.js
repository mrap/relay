var client       = require('./redis_client')
  , helper       = require('../lib/global_helpers')
  , getObjectID  = helper.getObjectID
  , mongoose     = require('mongoose')
  , Post         = mongoose.model('Post')
  , KEYS         = require('./events_monitor').KEYS;

var ActivityManager = {
  getTopLatestPosts: function(first, last, next){
    var offset = first;
    var count  = first + last;
    var args = [KEYS.TOP_LATEST_POSTS, '+inf', '-inf', 'LIMIT', offset, count];
    client.zrevrangebyscore(args, function(err, postIds){
      if (err) return next(err, null);
      var i = postIds.length;
      while(i--) {
        if (postIds[i] === 'null') postIds.splice(i, 1);
        else postIds[i] = getObjectID(postIds[i]);
      }
      Post.findByIds(postIds, next);
    });
  }
};

module.exports = ActivityManager;
