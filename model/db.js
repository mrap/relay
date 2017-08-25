var config         = require('../config')
  , mongoose       = require('mongoose')
  , UserSchema     = require('./user')
  , PostSchema     = require('./post')
  , LinkPostSchema = require('./link_post')
  , db             = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to MongoDB@%s", config.mongo.uri);

  // Seed development data (if needed)
  if (config.env == 'development' && process.env.SEED_DB){
    config.SEED_DB = false;
    console.log("seedDB");
    require('../config/seed_db')();
  }
});

// Connect
mongoose.connect(config.mongo.uri);
