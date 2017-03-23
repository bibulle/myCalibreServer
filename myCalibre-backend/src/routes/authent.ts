import { Router, Response, Request, NextFunction } from "express";

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
          passport.authenticate('local-login', (err, user, info): any => {
            if (err) {
              return next(err);
            }

            if (! user) {
              const msg = info || 'authentication failed';
              return response.status(401).send({error: msg});
            }

            request.login(user, loginErr => {
              if (loginErr) {
                return next(loginErr);
              }
              return response.send({message: "authentication succeeded"})
            })
          })(request, response, next);
        });

  router.route('/signup')
        // ====================================
        // route for processing the signup form
        // ====================================
        .post(passport.authenticate('local-signup', {
          successRedirect: '/profile', // redirect to the secure profile section
          failureRedirect: '/signup', // redirect back to the signup page if there is an error
          failureFlash: true // allow flash messages
        }));

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

