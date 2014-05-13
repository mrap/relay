'use strict'

var express  = require('express')
  , router   = express.Router()
  , passport = require('../config/passport')
  , User     = require('mongoose').model('User');

/* Check if user logged in by looking at session */
router.get('/loggedIn', function(req, res){
  res.send(req.isAuthenticated() ? req.user : 0);
});

/* User login */
router.post('/login',
            passport.authenticate('local-signup',
                                  { successRedirect : '/',
                                    failureRedirect : '/login',
                                    failureFlash    : true
                                  })
);

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('/login', function(req, res){
  res.render('users/login', { flash: req.flash() });
});

module.exports = router;
