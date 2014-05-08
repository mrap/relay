/*** Global Suite Setup and Tear Down ***/
//
var mongoose              = require('mongoose')
  , client                = require('../model/redis_client');
/*** Setup ***/
before(function(done){
  process.env.NODE_ENV  = 'test';
  app                 = require('../app');
  server = app.listen(5000, function() {
    chai                  = require('chai');
    should                = chai.should();
    expect                = chai.expect;
    User                  = mongoose.model('User');
    Post                  = mongoose.model('Post');
    LinkPost              = mongoose.model('link_post');
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
    integrationHelpers    = require('./integration/helpers');
    _                     = require('underscore');
    done();
  });
});

beforeEach(function(done){
  // Clean DB
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
  mongoose.disconnect(function(){
    server.close(done);
  });
});

