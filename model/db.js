var mongoose = require('mongoose')
  , UserSchema     = require('./user')
  , PostSchema     = require('./post')
  , LinkPostSchema = require('./link_post')
  , db = mongoose.connection
  , env = process.env.NODE_ENV;

var uri = 'mongodb://localhost/relay_dev';
if (env === 'test') uri = 'mongodb://localhost/relay_test';

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to MongoDB@%s", uri);

  // Seed development data (if needed)
  if (env == 'development' && process.env.SEED_DB){
    process.env.SEED_DB = false;
    console.log("seedDB");
    require('../config/seed_db');
  }
});
mongoose.connect(uri);
