var ScenarioFixture = require('../test/fixtures/scenarios.fixture')
  , mongoose = require('mongoose')
  , client = require('../model/redis_client')
  , assert = require('assert');

assert(process.env.NODE_ENV === 'development');

var seedDB = function(){

  // Drop MongoDB
  mongoose.connection.db.dropDatabase(function(err){
    if (err) throw err;

    // Flush Redis
    client.flushdb(function(err){
      if (err) throw err;
      console.log("Flushed Redis");

      // Seed Data
      var CONNECTIONS_COUNT = 10;
      ScenarioFixture.UserWithConnectionsAndFeed(null, CONNECTIONS_COUNT, function(err, u){
        if (err) throw err;
        console.log("development db seeded");
      });
    });
  });
};

module.exports = seedDB();
