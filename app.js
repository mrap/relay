var config       = require('./config')
  , express      = require('express')
  , path         = require('path')
  , favicon      = require('static-favicon')
  , logger       = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser   = require('body-parser')
  , session      = require('express-session')
  , flash        = require('connect-flash')
  , db           = require('./model/db')
  , passport     = require('./config/passport');

// Configure App
var app = express();
app.set('env', process.env.NODE_ENV);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(require('node-compass')({mode: 'expanded'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: config.session.secret, cookie: { maxAge: 60000 } }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Configure Routes
var routes = require('./routes')(app);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') !== 'production') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err.stack);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
