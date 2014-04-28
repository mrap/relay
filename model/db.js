var mongoose = require('mongoose')
  , User     = require('./user')
  , Post     = require('./post')
  , db = mongoose.connection
  , env = process.env.NODE_ENV;

var uri = 'mongodb://localhost/relay_dev';
if (env === 'test') uri = 'mongodb://localhost/relay_test';

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to MongoDB@%s", uri);
});
mongoose.connect(uri);
