var env    = process.env.NODE_ENV || 'development'
  ,config = require('./'+env);

module.exports = config;

