import * as express from "express";
var compression = require('compression');
import bodyParser = require("body-parser");
var cors = require('cors');
import { join } from "path";
import { bookRouter } from "./routes/book";
import { seriesRouter } from "./routes/series";

var serveStatic = require('serve-static')

var debug = require('debug')('server:server');
var warn = require('debug')('server:warn');

// init webApp
const app: express.Application = express();
app.disable("x-powered-by");
app.use(compression());


// app.use(favicon(join(__dirname, "public/img", "favicon.png")));
// app.use(express.static(join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// cors stuff
var originsWhiteList = ['http://localhost:4200'];
if (process.env['frontend']) {
  originsWhiteList = JSON.parse(process.env['frontend']);
}
var corsOptions = {
  origin: function(origin, callback){
    var isWhitelisted = originsWhiteList.indexOf(origin) !== -1;
    callback(null, isWhitelisted);
  },
  credentials:true
};
//noinspection TypeScriptValidateTypes
app.use(cors(corsOptions));


// api routes
app.use("/api/book", bookRouter);
app.use("/api/series", seriesRouter);

// define the 404 error
app.use(function (req: express.Request, res: express.Response, next) {
  res.status(404);

  warn("Error 404 Not found : " + req.url);

  // respond with json
  if (req.accepts('json') || req.accepts('html')) {
    res.send({error: 'Not found : ' + req.url});
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

export {app}
