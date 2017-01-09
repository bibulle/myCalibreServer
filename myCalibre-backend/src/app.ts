import * as express from "express";
var compression = require('compression');
import bodyParser = require("body-parser");
var cors = require('cors');
import { join } from "path";

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var bookRouter = require('./routes/book')(passport);
import { seriesRouter } from "./routes/series";
import { authorRouter } from "./routes/author";
import { tagRouter } from "./routes/tag";
import { User } from "./models/user";
import { Configuration } from "./models/configuration";
var userRouter = require('./routes/login')(passport);

var serveStatic = require('serve-static')

var debug = require('debug')('server:server');
var warn = require('debug')('server:warn');

Configuration.init();

// init webApp
const app: express.Application = express();
app.disable("x-powered-by");
app.use(compression());


// app.use(favicon(join(__dirname, "public/img", "favicon.png")));
// app.use(express.static(join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cors stuff
// ----------
var originsWhiteList = ['http://localhost:4200', 'http://r2d2', 'http://192.168.0.127'];
if (process.env['frontend']) {
  originsWhiteList = JSON.parse(process.env['frontend']);
}
var corsOptions = {
  origin: function (origin, callback) {
    var isWhitelisted = originsWhiteList.indexOf(origin) !== -1;
    callback(null, isWhitelisted);
  },
  credentials: true
};
//noinspection TypeScriptValidateTypes
app.use(cors(corsOptions));


// passport stuff (authentication)
// ----------
app.use(passport.initialize());
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function (username, password, done) {
    //debug(username + " " + password);

    User.checkUser(username, password)
      .then((user: User) => {
        done(null, user);
      })
      .catch(err => {
        done(null, false, { message: err })
      });
  }
));

// api routes
// ----------
app.use("/api/login", userRouter);
app.use("/api/book", bookRouter);
app.use("/api/series", seriesRouter);
app.use("/api/author", authorRouter);
app.use("/api/tag", tagRouter);

// define the 404 error
app.use(function (req: express.Request, res: express.Response, next) {
  res.status(404);

  warn("Error 404 Not found : " + req.url);

  // respond with json
  if (req.accepts('json') || req.accepts('html')) {
    res.send({ error: 'Not found : ' + req.url });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found : ' + req.url);
});


// error handlers
// development error handler : will print stacktrace
if (app.get("env") === "development") {

  app.use(express.static(join(__dirname, '../../node_modules')));

  app.use(function (err, req: express.Request, res: express.Response, next) {
    debug(err);
    res.status(err.status || 500);
    res.json({
      error: err,
      message: err.message
    });
  });
}


// production error handler : no stacktrace leaked to user
app.use(function (err: any, req: express.Request, res: express.Response) {
  debug(err);
  res.status(err.status || 500);
  res.json({
    error: {},
    message: err.message
  });
});

export { app }
