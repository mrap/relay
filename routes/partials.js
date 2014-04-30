var express = require('express');
var router = express.Router();

/* Handle Angular Partials */
router.get('/:name', function(req, res){
  res.render('partials/' + req.params.name);
});

module.exports = router;
