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

        request['login'](user, loginErr => {
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
  router.route('/user')
  // ====================================
  // route to get a new token (on user update)
  // ====================================
  //
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /user");
      passport.authenticate(['jwt-check'], {session: false}, (err, user, info): any => {
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

        User.findById(user.id, (err: Error, loadedUser: User) => {
          if (err) {
            return next(err);
          }
          let sendUser = _.pick(loadedUser, ['id', 'created', 'updated', 'local.username', 'local.firstname', 'local.lastname', 'local.email', 'local.isAdmin', 'local.amazonEmails', 'facebook', 'twitter', 'google', 'history']);

          delete sendUser.facebook.token;
          delete sendUser.google.token;
          delete sendUser.twitter.token;

          response.status(200).send(JSON.stringify({data: sendUser}));
        });
      })(request, response, next);
    });

  router.route('/signup')
  // ====================================
  // route for processing the local signup form
  // ====================================
    .post((request: Request, response: Response, next: NextFunction) => {
      debug("POST /signup");
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

        request['login'](user, loginErr => {
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

        request['login'](user, loginErr => {
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
  // route for saving a user
  // ====================================
    .post((request: Request, response: Response, next: NextFunction) => {
      debug("POST /save");
      passport.authenticate(['jwt-check'], {session: false}, (err, user): any => {

        if (err) {
          return next(err);
        }

        // user is the connected user
        // request.body['user'] is the user to save

        // if trying to update me (not another user.. do it)
        if (user.id === request.body['user']['id']) {
          return _saveAUser(user, request, response, next, true);
        }

        // trying to update another user
        if (!user.local || !user.local.isAdmin) {
          return response.status(401).send({error: "Not authorized."})
        }

        User.findById(request.body['user']['id'], (err: Error, modifiedUser: User) => {
          if (err) {
            return next(err);
          }
          return _saveAUser(modifiedUser, request, response, next, false);
        });

      })(request, response, next);
    });

  router.route('/delete')
  // ====================================
  // route for deleting a user
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /delete");
      passport.authenticate(['jwt-check'], {session: false}, (err, user): any => {

        if (err) {
          return next(err);
        }

        // get the parameter
        let deletedUserId = request.query['userId'];
        if (!deletedUserId || (deletedUserId.length === 0)) {
          return response.status(400).send({error: "Bad request"});
        }
        deletedUserId = deletedUserId[0].replace(/ /g, "+");

        // user must be an admin
        if (!user.local || !user.local.isAdmin) {
          return response.status(401).send({error: "Not authorized."})
        }

        // you can't delete yourself
        if (user.id === deletedUserId) {
          return response.status(401).send({error: "Not authorized."})
        }

        // Do the job
        User.findById(deletedUserId[0], (err: Error, deletedUser: User) => {
          if (err) {
            return next(err);
          }
          DbMyCalibre
            .deleteUser(deletedUser)
            .then(() => {
              response.status(200).send({
                data: "done"
              });
            })
            .catch(err => {
              return next(err);
            });
        });

      })(request, response, next);
    });

  router.route('/reset')
  // ====================================
  // route for resetting a password
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /reset");
      passport.authenticate(['jwt-check'], {session: false}, (err, user): any => {

        if (err) {
          return next(err);
        }

        // get the parameter
        let modifiedUserId = request.query['userId'];
        if (!modifiedUserId || (modifiedUserId.length === 0)) {
          return response.status(400).send({error: "Bad request"});
        }
        modifiedUserId = modifiedUserId[0].replace(/ /g, "+");

        // user must be an admin
        if (!user.local || !user.local.isAdmin) {
          return response.status(401).send({error: "Not authorized."})
        }


        // Do the job
        User.findById(modifiedUserId[0], (err: Error, modifiedUser: User) => {
          if (err) {
            return next(err);
          }

          // generate a password
          let newPassword =(Math.random()*100000).toFixed(0)+"";
          while (newPassword.length < 5) newPassword = "0" + newPassword;

          modifiedUser.local['password'] = newPassword;
          const newUser = new User(modifiedUser);

          DbMyCalibre
            .saveUser(newUser, false)
            .then(() => {
              response.status(200).send(JSON.stringify({newPassword: newPassword}));
            })
            .catch(err => {
              return next(err);
            });

        });

      })(request, response, next);
    });

  router.route('/list')
  // ====================================
  // route for getting all users list
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /list");
      passport.authenticate(['jwt-check'], {session: false}, (err, user): any => {

        if (err) {
          return next(err);
        }

        // Must be admin
        if (!user.local || !user.local.isAdmin) {
          return response.status(401).send({error: "Not authorized."})
        }

        // Get the list
        DbMyCalibre
          .getAllUsers()
          .then((users) => {
            users = users.map(u => _.omit(u, ['local.salt', 'local.password', 'local.hashedPassword']) as User);
            response.status(200).send(JSON.stringify({data: users}));
          })
          .catch(err => {
            debug(err);
            return next(err);
          });

      })(request, response, next);
    });

  router.route('/merge')
  // ====================================
  // route for merging user
  // ====================================
    .get((request: Request, response: Response, next: NextFunction) => {
      debug("GET /merge");
      passport.authenticate(['jwt-check'], {session: false}, (err, user): any => {

        if (err) {
          return next(err);
        }

        // Must be admin
        if (!user.local || !user.local.isAdmin) {
          return response.status(401).send({error: "Not authorized."})
        }

        // Get the users id
        let modifiedUserId1 = request.query['userId1'];
        let modifiedUserId2 = request.query['userId2'];
        if (!modifiedUserId1 || !modifiedUserId2 || (modifiedUserId1.length === 0) || (modifiedUserId2.length === 0)) {
          return response.status(400).send({error: "Bad request"});
        }

        modifiedUserId1 = modifiedUserId1[0].replace(/ /g, "+");
        modifiedUserId2 = modifiedUserId2[0].replace(/ /g, "+");

        // Get the Users
        DbMyCalibre
          .findUserById(modifiedUserId1[0])
          .then((user1) => {

            if (!user1) {
              return response.status(400).send({error: "Bad request"});
            }

            DbMyCalibre
              .findUserById(modifiedUserId2[0])
              .then((user2) => {

                if (!user2) {
                  return response.status(400).send({error: "Bad request"});
                }

                User.mergeAndSave(user1, user2, err => {
                  if (err) {
                    debug(err);
                    return next(err);
                  }

                  // return the users list
                  DbMyCalibre
                    .getAllUsers()
                    .then((users) => {
                      users = users.map(u => _.omit(u, ['local.salt', 'local.password', 'local.hashedPassword']) as User);
                      response.status(200).send(JSON.stringify({data: users}));
                    })
                    .catch(err => {
                      debug(err);
                      return next(err);
                    });
                });
              })
              .catch(err => {
                debug(err);
                return next(err);
              });
          })
          .catch(err => {
            debug(err);
            return next(err);
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
      passport.authenticate(['facebook'], {scope: 'email'}, (err): any => {
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

        passport.authenticate(['facebook'], {}, (err, newUser: User): any => {

          if (err) {
            console.log(err);
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

      let modifiedUserId = request.query['userId'];
      if (!modifiedUserId ||  (modifiedUserId.length === 0)) {
        return response.status(400).send({error: "Bad request"});
      }

      modifiedUserId = modifiedUserId[0].replace(/ /g, "+");

      _getBearerUser(request, (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return response.status(401).send({error: "Not authenticate"});
        }

        console.log(modifiedUserId);
        console.log(user.id);
        // Modifying another user
        if (modifiedUserId !== user.id) {
          if (!user.local.isAdmin) {
            return response.status(403).send({error: "Not authorized"});
          } else {
            User.findById(modifiedUserId as string, (err: Error, modifiedUser: User) => {
              if (err) {
                return next(err);
              }
              modifiedUser.facebook.token = null;
              modifiedUser.facebook.id = null;
              modifiedUser.facebook.email = null;
              modifiedUser.facebook.name = null;

              _saveAndSendBack(modifiedUser, false, response, next);

            });
          }
        } else {
          user.facebook.token = null;
          user.facebook.id = null;
          user.facebook.email = null;
          user.facebook.name = null;

          _saveAndSendBack(user, true, response, next);
        }

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
      passport.authenticate('google', {scope: ['profile', 'email']}, (err): any => {
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
        //debug("----- connected -----");
        //debug(connectedUser);

        passport.authenticate(['google'], {}, (err, newUser: User): any => {

          if (err) {
            return next(err);
          }

          //debug("----- newUser -----");
          //debug(newUser);
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

      let modifiedUserId = request.query['userId'];
      if (!modifiedUserId || (modifiedUserId.length === 0)) {
        return response.status(400).send({error: "Bad request"});
      }

      modifiedUserId = modifiedUserId[0].replace(/ /g, "+");

      _getBearerUser(request, (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return response.status(401).send({error: "Not authenticate"});
        }

        // Modifying another user
        if (modifiedUserId !== user.id) {
          if (!user.local.isAdmin) {
            return response.status(403).send({error: "Not authorized"});
          } else {
            User.findById(modifiedUserId as string, (err: Error, modifiedUser: User) => {
              if (err) {
                return next(err);
              }
              modifiedUser.google.token = null;
              modifiedUser.google.id = null;
              modifiedUser.google.email = null;
              modifiedUser.google.name = null;

              _saveAndSendBack(modifiedUser, false, response, next);

            });
          }
        } else {
          user.google.token = null;
          user.google.id = null;
          user.google.email = null;
          user.google.name = null;

          _saveAndSendBack(user, true, response, next);

        }


      });
    });

  return router;
}

// noinspection JSUnusedLocalSymbols
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
    let authorization: string = request.headers.authorization[0];
    if (typeof request.headers.authorization === "string") {
      authorization = request.headers.authorization;
    }
    // console.log(authorization);
    const parts = authorization.split(' ');
    // console.log(parts);
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

/**
 * Save user and send back (user or bearer depending on autoUpdate or not)
 * @param user
 * @param autoUpdate
 * @param response
 * @param next
 * @returns {any}
 * @private
 */
function _saveAndSendBack(user, autoUpdate: boolean, response: Response, next: NextFunction) {
  DbMyCalibre
    .saveUser(user, false)
    .then(() => {

      if (autoUpdate) {
        debug("201 : token created(" + user.id + ")");
        response.status(201).send({
          id_token: User.createToken(user)
        });
      } else {
        user = _.omit(user, ['local.salt', 'local.password', 'local.hashedPassword']);
        response.status(200).send({
          data: user
        });
      }
    })
    .catch(err => {
      return next(err);
    });
  return user;
}
/**
 * Save a user a return what is needed (bearer or object)
 * @param user
 * @param request
 * @param response
 * @param next
 * @param autoUpdate
 * @private
 */
function _saveAUser(user, request: Request, response: Response, next: NextFunction, autoUpdate: boolean) {
  const options = _.omit(request.body['user'], ['id', 'local.salt', 'local.password', 'local.hashedPassword']);

  if (options['local']['amazonEmails']) {
    user['local']['amazonEmails'] = options['local']['amazonEmails'];
  }
  _.merge(user, options);

  // debug(user['local']);
  // debug(options['local']);

  // Check if username already exist
  //DbMyCalibre
  //  .findUserByUsername(user.local.username)
  //  .then((userDb) => {
  //    if (userDb && (userDb.id !== user.id)) {
  //      response.status(401).send({error: "That username already exists."})
  //    } else {
        _saveAndSendBack(user, autoUpdate, response, next);
  //    }
  //  });
}


export {authentRouter}
