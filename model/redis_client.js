var redis  = require('redis')
  , port   = (process.env.NODE_ENV == 'test') ? 7777 : 6379
  , client = redis.createClient(port);

client.on("connect", function(){
  console.log("Redis connected at port %s", client.port);
});

redis.debug_mode = false;

module.exports = client;
