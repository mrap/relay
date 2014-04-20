var mongoose = require('mongoose');
var env = process.env.NODE_ENV
var db = mongoose.connection
if (env == 'development') mongoose.connect('mongodb://localhost/relay_dev')
if (env == 'test') {
  // Clean models and schemas
  mongoose.models = {}
  mongoose.modelSchemas = {}
  // mongoose.createConnection('mongodb://localhost/relay_test')
  mongoose.connect('mongodb://localhost/relay_test')
}

db.on('error', console.error.bind(console, 'connection error:'));
