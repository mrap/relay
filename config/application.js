var config = module.exports = {}
  , crypto = require('crypto');

config.env = 'development';
config.session = {
  secret: crypto.randomBytes(20).toString('hex')
};

// MongoDB
config.mongo = {};

// Redis
config.redis = {};

// S3
config.s3 = require('./secret/s3');

