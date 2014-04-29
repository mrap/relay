
/*** Global Suite Setup and Tear Down ***/
var mongoose = require('mongoose');

/*** Setup ***/
before(function(done){
  chai                  = require('chai');
  should                = chai.should();
  expect                = chai.expect;
  User                  = mongoose.model('User');
  Post                  = mongoose.model('Post');
  FeedManager           = require('../model/feed_manager');
  FeedItem              = require('../model/feed_item');
  ActivityManager       = require('../model/activity_manager');
  UserConnectionManager = require('../model/user_connection_manager');
  helpers               = require('../lib/global_helpers');
  getObjectID           = helpers.getObjectID;
  containsObject        = helpers.containsObject;
  PostFixture           = require('./fixtures/posts.fixture');
  UserFixture           = require('./fixtures/users.fixture');
  ScenarioFixture = require('./fixtures/scenarios.fixture');
  Factory               = require('./factories');

  process.env.NODE_ENV = 'test';
  require('../app');
  done();
});

beforeEach(function(done){
  mongoose.connection.collections['users'].drop( function(err) {
    if (err && err.message != "ns not found" ) console.error(err);
    mongoose.connection.collections['posts'].drop( function(err) {
      if (err && err.message != "ns not found" ) console.error(err);
      done();
    });
  });
});

after(function(done){
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.disconnect();
  done();
});

