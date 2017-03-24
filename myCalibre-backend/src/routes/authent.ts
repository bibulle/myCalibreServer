import { Router, Response, Request, NextFunction } from "express";
import { User } from "../models/user";

const debug = require('debug')('server:routes:authent');

// -----------------------------------
// --     /authent routes     --
// -----------------------------------

function authentRouter (passport): Router {
  const router: Router = Router();

  router.route('/login')
        // ====================================
        // route for processing the login form
        // ====================================
        //
        .post((request: Request, response: Response, next: NextFunction) => {
          debug("POST /login");
          passport.authenticate(['jwt-check', 'local-login'], {session: false}, (err, user, info): any => {
            if (err) {
              return next(err);
            }

            if (! user) {
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
              debug("201 : token created(" + user + ")");
              return response.status(201).send({
                id_token: User.createToken(user)
              });
            })
          })(request, response, next);
        });

  router.route('/signup')
        // ====================================
        // route for processing the signup form
        // ====================================
        .post((request: Request, response: Response, next: NextFunction) => {
          debug("POST /login");
          passport.authenticate(['jwt-check', 'local-signup'], {session: false}, (err, user, info): any => {
            if (err) {
              return next(err);
            }

            if (! user) {
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
              debug("201 : token created(" + user + ")");
              return response.status(201).send({
                id_token: User.createToken(user)
              });
            })
          })(request, response, next);
        });

  router.route('/profile')
        // ====================================
        // route for showing the profile form TODO: should be moved to frontend ?
        // ====================================
        .get((request: Request, response: Response) => {
          debug("GET /profile");

          //debug(request.query);
        });

  router.route('/logout')
        // ====================================
        // route for logout  TODO: should be moved to frontend ?
        // ====================================
        .get((request: Request, response: Response) => {
          debug("GET /logout");

          request.logout();
          response.redirect('/');
          //debug(request.query);
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
function isLoggedIn (request, response, next) {

  // if user is authenticated in the session, carry on
  if (request.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  response.redirect('/');
}


export { authentRouter }

