var redis  = require('redis')
  , client = redis.createClient();

redis.debug_mode = false;

module.exports = client;
