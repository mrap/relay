
/*** Global Suite Setup and Tear Down ***/
var mongoose = require('mongoose')
  , client   = require('../model/redis_client');

/*** Setup ***/
before(function(done){
  process.env.NODE_ENV  = 'test';
  app                   = require('../app');
  chai                  = require('chai');
  should                = chai.should();
  expect                = chai.expect;
  User                  = mongoose.model('User');
  Post                  = mongoose.model('Post');
  FeedManager           = require('../model/feed_manager');
  FeedItem              = require('../model/feed_item');
  UserConnectionManager = require('../model/user_connection_manager');
  helpers               = require('../lib/global_helpers');
  getObjectID           = helpers.getObjectID;
  containsObject        = helpers.containsObject;
  eqObjectIDs           = helpers.eqObjectIDs;
  PostFixture           = require('./fixtures/posts.fixture');
  UserFixture           = require('./fixtures/users.fixture');
  ScenarioFixture       = require('./fixtures/scenarios.fixture');
  Factory               = require('./factories');
  done();
});

beforeEach(function(done){
  mongoose.connection.collections['users'].drop( function(err) {
    if (err && err.message != "ns not found" ) console.error(err);
    mongoose.connection.collections['posts'].drop( function(err) {
      if (err && err.message != "ns not found" ) console.error(err);
      client.flushdb(done);
    });
  });
});

after(function(done){
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.disconnect();
  done();
});

