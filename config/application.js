var config = module.exports = {};

config.env = 'development';

// MongoDB
config.mongo = {};

// Redis
config.redis = {};

// S3
config.s3 = require('./secret/s3');

