
/*** Global Suite Setup and Tear Down ***/

/*** Setup ***/
beforeEach(function(done){
  process.env.NODE_ENV = 'test'
  require('mocha-mongoose')('mongodb://localhost/relay_test');
  require('../app')
  done();
});

afterEach(function(done){
  // var mongoose = require('mongoose');
  // mongoose.models = {}
  // mongoose.modelSchemas = {}
  done();
});

