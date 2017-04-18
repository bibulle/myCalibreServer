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

  router.route('/connect/local')
  // ====================================
  // route for processing the connection to a local account
  // ====================================
    .post((request: Request, response: Response, next: NextFunction) => {
      debug("POST /connect/local");
      passport.authenticate(['jwt-check'], {session: false}, (err, user, info): any => {
        //debug(err);
        //debug(user);
        //debug(info);

        if (err) {
          return next(err);
        }

        if (!user) {
          debug(info);
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

        if (options['local']['amazonEmails']) {
          user['local']['amazonEmails'] = options['local']['amazonEmails'];
        }
        _.merge(user, options);

        // debug(user['local']);
        // debug(options['local']);

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

      // get the connected user if exists
      _getBearerUser(request, (err, connectedUser) => {
        if (err) {
          return next(err);
        }

        passport.authenticate(['facebook'], {}, (err, newUser: User, info): any => {

          if (err) {
            return next(err);
          }

          // if two users
          if (connectedUser) {
            User.mergeAndSave(connectedUser, newUser, err => {
              if (err) {
                return next(err);
              }
              debug("201 : token created(" + connectedUser.id + ")");
              return response.status(201).send({
                id_token: User.createToken(connectedUser)
              });
            });
          } else {
            //debug(newUser);
            debug("201 : token created(" + newUser.id + ")");
            return response.status(201).send({
              id_token: User.createToken(newUser)
            });

          }

        })(request, response, next);
      });
    });
  router.route('/facebook/unlink')
  // ====================================
  // route to unlink a authenticate user from facebook
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /facebook/unlink");

      _getBearerUser(request, (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return response.status(401).send({error: "Not authenticate"});
        }

        user.facebook.token = null;
        user.facebook.id = null;
        user.facebook.email = null;
        user.facebook.name = null;

        user.save(err => {
          if (err) {
            return next(err);
          }
          debug("201 : token created(" + user.id + ")");
          return response.status(201).send({
            id_token: User.createToken(user)
          });
        })

      });
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
      passport.authenticate('google', {scope: ['profile', 'email']}, (err, user, info): any => {
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

      // get the connected user if exists
      _getBearerUser(request, (err, connectedUser) => {
        if (err) {
          return next(err);
        }

        passport.authenticate(['google'], {}, (err, newUser: User, info): any => {

          if (err) {
            return next(err);
          }

          // if two users
          if (connectedUser) {
            User.mergeAndSave(connectedUser, newUser, err => {
              if (err) {
                return next(err);
              }
              debug("201 : token created(" + connectedUser.id + ")");
              return response.status(201).send({
                id_token: User.createToken(connectedUser)
              });
            });
          } else {
            //debug(newUser);
            debug("201 : token created(" + newUser.id + ")");
            return response.status(201).send({
              id_token: User.createToken(newUser)
            });

          }

        })(request, response, next);
      });
    });
  router.route('/google/unlink')
  // ====================================
  // route to unlink a authenticate user from facebook
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /google/unlink");

      _getBearerUser(request, (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return response.status(401).send({error: "Not authenticate"});
        }

        user.google.token = null;
        user.google.id = null;
        user.google.email = null;
        user.google.name = null;

        user.save(err => {
          if (err) {
            return next(err);
          }
          debug("201 : token created(" + user.id + ")");
          return response.status(201).send({
            id_token: User.createToken(user)
          });
        })

      });
    });

  return router;
}

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

/**
 * get Bearer user from request if it exists
 * @param request
 * @param callback
 * @returns {any}
 * @private
 */
function _getBearerUser(request: Request, callback: (err, user: User) => (any)): User {
  let token: string;
  if (request.headers && request.headers.authorization) {
    const parts = request.headers.authorization.split(' ');
    if (parts.length == 2) {
      const scheme = parts[0]
        , credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    }
  }
  if (!token) {
    return callback(null, null);
  }

  User.checkToken(token, callback);

}


export {authentRouter}

