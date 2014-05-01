var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {});
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

module.exports = router;
