
/*** Global Suite Setup and Tear Down ***/

/*** Setup ***/
beforeEach(function(){
  process.env.NODE_ENV = 'test'
  require('mocha-mongoose')('mongodb://localhost/relay_test');
  require('../app')
})

