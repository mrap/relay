var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var User = require('mongoose').model('User');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {});
});

router.get('/loggedIn', function(req, res){
  res.send(req.isAuthenticated() ? req.user : 0);
});

/* User login */
// TODO: Move into own "auth" routes module
router.get('/login', function(req, res){
  res.render('users/login', { flash: req.flash() });
});

router.post('/login',
            passport.authenticate('local-signup',
                                  { successRedirect : '/',
                                    failureRedirect : '/login',
                                    failureFlash    : true
                                  })
);

router.post('/signup', function(req, res){
});

module.exports = router;
