
/*** Global Suite Setup and Tear Down ***/
var mongoose = require('mongoose');

/*** Setup ***/
before(function(done){
  process.env.NODE_ENV = 'test'
  require('../app');
  require('./factories');
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

