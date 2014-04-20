
/*** Global Suite Setup and Tear Down ***/

/*** Setup ***/
beforeEach(function(done){
  process.env.NODE_ENV = 'test'
  var app = require('../app')
  done()
})

/*** Tear Down ***/
var mongoose = require('mongoose')
afterEach(function(done){
  // Clean DB
  mongoose.connection.close(done())
})
