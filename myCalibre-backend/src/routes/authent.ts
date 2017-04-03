import * as _ from "lodash";
import {Router, Response, Request, NextFunction} from "express";
import {User} from "../models/user";
import DbMyCalibre from "../models/dbMyCalibre";

const debug = require('debug')('server:routes:authent');

// -----------------------------------
// --     /authent routes     --
// -----------------------------------

function authentRouter(passport): Router {
  const router: Router = Router();

  // =====================================
  // LOCAL ROUTES =====================
  // =====================================
  router.route('/login')
  // ====================================
  // route for processing the local login form
  // ====================================
  //
    .post((request: Request, response: Response, next: NextFunction) => {
      debug("POST /login");
      passport.authenticate(['jwt-check', 'local-login'], {session: false}, (err, user, info): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          debug(info);
          //debug(info.name);
          //debug(info.message);
          const msg = info.message || info || 'authentication failed';
          return response.status(401).send({error: msg});
        }

        request.login(user, loginErr => {
          if (loginErr) {
            return next(loginErr);
          }
          debug("201 : token created(" + user.id + ")");
          return response.status(201).send({
            id_token: User.createToken(user)
          });
        })
      })(request, response, next);
    });

  router.route('/signup')
  // ====================================
  // route for processing the local signup form
  // ====================================
    .post((request: Request, response: Response, next: NextFunction) => {
      debug("POST /login");
      passport.authenticate(['jwt-check', 'local-signup'], {session: false}, (err, user, info): any => {
        if (err) {
          return next(err);
        }

        if (!user) {
          debug(info);
          //debug(info.name);
          //debug(info.message);
          const msg = info.message || info || 'authentication failed';
          return response.status(401).send({error: msg});
        }

        request.login(user, loginErr => {
          if (loginErr) {
            return next(loginErr);
          }
          debug("201 : token created(" + user.id + ")");
          return response.status(201).send({
            id_token: User.createToken(user)
          });
        })
      })(request, response, next);
    });

  router.route('/save')
  // ====================================
  // route for processing the local profile form (save a user)
  // ====================================
    .post((request: Request, response: Response, next: NextFunction) => {
      debug("POST /save");
      passport.authenticate(['jwt-check'], {session: false}, (err, user, info): any => {

        if (err) {
          return next(err);
        }

        const options = _.omit(request.body['user'], ['id', 'local.salt', 'local.password', 'local.hashedPassword']);
        _.merge(user, options);

        // Check if username already exist
        DbMyCalibre.getInstance()
          .findUserByUsername(user.local.username)
          .then((userDb) => {
            if (userDb && (userDb.id !== user.id)) {
              response.status(401).send({error: "That username already exists."})
            } else {
              DbMyCalibre.getInstance()
                .saveUser(user, false)
                .then(() => {
                  debug("201 : token created(" + user.id + ")");
                  response.status(201).send({
                    id_token: User.createToken(user)
                  });
                })
                .catch(err => {
                  return next(err);
                });
            }
          });

      })(request, response, next);
    });

  // =====================================
  // FACEBOOK ROUTES =====================
  // =====================================

  router.route('/facebook')
  // ====================================
  // route for sending our user to Facebook to authenticate
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /facebook");
      passport.authenticate(['facebook'], {scope: 'email'}, (err, user, info): any => {
        if (err) {
          return next(err);
        }
      })(request, response, next);
    });
  router.route('/facebook/login')
  // ====================================
  // route to get a jwt token for a facebook authenticate user
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /facebook/login");
      passport.authenticate(['facebook'], {}, (err, user, info): any => {

        if (err) {
          return next(err);
        }

        //debug(user);
        debug("201 : token created(" + user.id + ")");
        return response.status(201).send({
          id_token: User.createToken(user)
        });
      })(request, response, next);
    });

  // =====================================
  // GOOGLE ROUTES ======================
  // =====================================

  router.route('/google')
  // ====================================
  // route for sending our user to Google to authenticate
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /google");
      passport.authenticate('google', { scope : ['profile', 'email'] }, (err, user, info): any => {
        //console.log(err);
        //console.log(user);
        //console.log(info);
        if (err) {
          return next(err);
        }
      })(request, response, next);
    });
  router.route('/google/login')
  // ====================================
  // route to get a jwt token for a google authenticate user
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /google/login");
      passport.authenticate(['google'], {}, (err, user, info): any => {

        if (err) {
          return next(err);
        }

        //debug(user);
        debug("201 : token created(" + user.id + ")");
        return response.status(201).send({
          id_token: User.createToken(user)
        });
      })(request, response, next);
    });

  return router;
}
// route middleware to make sure a user is logged in
/**
 * to be sure the user is logged in
 * @param request
 * @param response
 * @param next
 * @returns {any}
 */
function isLoggedIn(request, response, next) {

  // if user is authenticated in the session, carry on
  if (request.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  response.redirect('/');
}


export {authentRouter}

