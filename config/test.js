var config = require('./application');

config.env        = 'test';
config.mongo.host = 'localhost';
config.mongo.db   = 'relay_test';
config.mongo.uri  = 'mongodb://'+config.mongo.host+'/'+config.mongo.db;

config.redis.port = '7777';

module.exports = config;
