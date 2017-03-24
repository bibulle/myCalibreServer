import DbMyCalibre from "./models/dbMyCalibre";

const JwtStrategy = require('passport-jwt').Strategy;
const JwtExtractor = require('passport-jwt').ExtractJwt;
const BearerStrategy = require('passport-http-bearer').Strategy

const LocalStrategy = require('passport-local').Strategy;

const debug = require('debug')('server:config:passport');

import { User } from "./models/user";


module.exports = function (passport) {

  DbMyCalibre.getInstance()
             .getConf()
             .then(conf => {
               // =========================================================================
               // passport session setup ==================================================
               // =========================================================================
               // required for persistent login sessions
               // passport needs ability to serialize and unserialize users out of session

               // used to serialize the user for the session
               passport.serializeUser(function (user, done) {
                 //debug("1");
                 //debug(user);
                 done(null, user.local.email);
               });

               // used to deserialize the user
               passport.deserializeUser(function (email, done) {
                 //debug("2");
                 //debug(email);
                 User.findByEmail(email, function (err, user) {
                   done(err, user);
                 });
               });

               // =========================================================================
               // CHECK JWT ===============================================================
               // =========================================================================
               passport.use('jwt-check', new BearerStrategy(
                 {
                 passReqToCallback: true
                 },
                 (request, payload, done) => {
                   debug("jwt-check ");
                   User.checkToken(payload, function(err, decoded) {
                     if (err) {
                       //debug(err);
                       return done(err);
                     }
                     request.user = decoded;
                     //debug(request.user);
                     return done(null, request.user);
                   })
                 })
               );

               // =========================================================================
               // LOCAL SIGNUP ============================================================
               // =========================================================================
               passport.use('local-signup', new LocalStrategy({
                   usernameField: 'email',
                   passwordField: 'password',
                   passReqToCallback: true
                 },
                 function (req, email, password, done) {

                   debug("local-signup");
                   process.nextTick(function () {
                     // find a user whose email is the same as the forms email
                     // we are checking to see if the user trying to login already exists
                     User.findByEmail(email, function (err, user) {
                       // if there are any errors, return the error
                       if (err) {
                         debug(err);
                         return done(err);
                       }

                       // check to see if there is already a user with that email
                       if (user) {
                         debug('That email is already taken.');
                         return done(null, false, 'That email is already taken.');
                       } else {

                         // if there is no user with that email
                         // create the user
                         var newUser = new User({
                           local: {
                             email: email,
                             password: password
                           }
                         });

                         // save the user
                         newUser.save(function (err) {
                           if (err) {
                             return done(err);
                           }
                           return done(null, newUser);
                         });
                       }

                     });

                   });

                 }));

               // =========================================================================
               // LOCAL LOGIN =============================================================
               // =========================================================================
               passport.use('local-login', new LocalStrategy({
                   usernameField: 'email',
                   passwordField: 'password',
                   passReqToCallback: true
                 },
                 function (req, email, password, done) {

                   debug("local-login");
                   // find a user whose email is the same as the forms email
                   // we are checking to see if the user trying to login already exists
                   User.findByEmail(email, function (err, user) {
                     // if there are any errors, return the error before anything else
                     if (err) {
                       debug(err);
                       return done(err);
                     }

                     // if no user is found, return the message
                     if (!user) {
                       return done(null, false, 'Your user or your password is wrong.');
                     }

                     // if the user is found but the password is wrong
                     if (!user.validPassword(password)) {
                       //return done(null, false, req.flash('loginMessage', 'Your user or your password is wrong.')); // create the loginMessage and save it to session as flashdata
                       return done(null, false, 'Your user or your password is wrong.');
                     }

                     // all is well, return successful user
                     return done(null, user);
                   });

                 }));

               User.init();

             });


}
