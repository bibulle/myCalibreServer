import { Router, Response, Request, NextFunction } from "express";
import { User } from "../models/user";

const debug = require('debug')('server:routes:login');


module.exports = function (passport) {

  const loginRouter: Router = Router();


// -----------------------------------
// --     /api/route routes     --
// -----------------------------------

  loginRouter.route('/')
            // ====================================
            // route for login
            // ====================================
            .post((request: Request, response: Response, next: NextFunction) => {
              debug("GET /");
              //debug(request.body);

              passport.authenticate('local', { session: false },
                (err, user, info) => {
                if (err) {
                  debug("ERROR : "+err);
                  next(err);
                  return;
                }
                if (!user) {
                  debug("401");
                  response.status(401);
                  return response.send({ error: 'Unauthorized', message: info.message || info });
                }

                  debug("201 : jwt token created(" + request.body.username + ")");
                  response.status(201).send({
                    id_token: User.createToken(user)
                  });


                // User.getAllUsers().then((u)=>{debug(u)});
                //
                // request.logIn(user, function (err) {
                //   if (err) {
                //     debug("ERROR1 : "+err);
                //     return next(err);
                //   }
                //   return response.redirect('/users/' + user.username);
                // });
              })(request, response, next);
            });


  return loginRouter;


};

