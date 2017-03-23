import * as express from "express";
const compression = require('compression');
import bodyParser = require("body-parser");
import cookieParser = require("cookie-parser");
const cors = require('cors');
import { join } from "path";
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

import { bookRouter } from "./routes/book";
import { seriesRouter } from "./routes/series";
import { authorRouter } from "./routes/author";
import { tagRouter } from "./routes/tag";
import { authentRouter } from "./routes/authent";

const debug = require('debug')('server:server');
const warn = require('debug')('server:warn');

//--------------
// init webApp
//--------------
const app: express.Application = express();
app.disable("x-powered-by");
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//--------------
// cors stuff
//--------------
let originsWhiteList = ['http://localhost:4200', 'http://r2d2', 'http://192.168.0.127'];
if (process.env['frontend']) {
  originsWhiteList = JSON.parse(process.env['frontend']);
}
const corsOptions = {
  origin: function (origin, callback) {
    const isWhiteListed = originsWhiteList.indexOf(origin) !== -1;
    callback(null, isWhiteListed);
  },
  credentials: true
};
//noinspection TypeScriptValidateTypes
app.use(cors(corsOptions));

//--------------
// passport routes (authentication)
//--------------
require('./config_passport')(passport); // pass passport for configuration

app.use(session({
  secret: 'ilovescotchscotchyscotchscotch',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//--------------
// api routes
//--------------
app.use("/api/book", bookRouter);
app.use("/api/series", seriesRouter);
app.use("/api/author", authorRouter);
app.use("/api/tag", tagRouter);
app.use("/authent", authentRouter(passport));

//--------------
// define the 404 error
//--------------
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


//--------------
// error handlers
//--------------
// development error handler : will print stacktrace
if (app.get("env") === "development") {

  app.use(express.static(join(__dirname, '../../node_modules')));

  app.use(function (err, req: express.Request, res: express.Response, next) {
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
