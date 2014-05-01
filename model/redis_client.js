var redis  = require('redis')
  , config = require('../config')
  , client = redis.createClient(config.redis.port);

client.on("connect", function(){
  console.log("Redis connected at port %s", client.port);
});

redis.debug_mode = false;

module.exports = client;
