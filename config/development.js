var config = require('./application');

config.env        = 'development';
config.mongo.host = 'localhost';
config.mongo.db   = 'relay_dev';
config.mongo.uri  = 'mongodb://'+config.mongo.host+'/'+config.mongo.db;

config.redis.port = '6379';

module.exports = config;
