'use strict'

module.exports = function(app) {

  /* View Helpers */
  app.use(function (req, res, next) {
    res.locals.userLoggedIn = req.isAuthenticated();
    next();
  });
  app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    next();
  });

  /* GET home page. */
  app.get('/', function(req, res) {
    res.render('index', {});
  });

  app.use('/'         , require('./auth'));
  app.use('/partials' , require('./partials') )
  app.use('/posts'    , require('./posts') );
  app.use('/users'    , require('./users') );

};
