var mongoose = require('mongoose');
var env = process.env.NODE_ENV
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to MongoDB");
  require('./user');
  require('./post');
});

if (env == 'development') mongoose.connect('mongodb://localhost/relay_dev')
if (env == 'test') {
  // Clean models and schemas
  // mongoose.createConnection('mongodb://localhost/relay_test')
  mongoose.connect('mongodb://localhost/relay_test');
}
