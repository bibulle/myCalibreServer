import DbMyCalibre from "./models/dbMyCalibre";

const JwtStrategy = require('passport-jwt').Strategy;
const JwtExtractor = require('passport-jwt').ExtractJwt;
const BearerStrategy = require('passport-http-bearer').Strategy

const LocalStrategy = require('passport-local').Strategy;

const debug = require('debug')('server:config:passport');

import {User} from "./models/user";


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
                done(null, user.local.username);
            });

            // used to deserialize the user
            passport.deserializeUser(function (username, done) {
                //debug("2");
                //debug(email);
                User.findByUsername(username, function (err, user) {
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
                    User.checkToken(payload, function (err, decoded) {
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
                    usernameField: 'username',
                    passwordField: 'password',
                    passReqToCallback: true
                },
                function (req, username, password, done) {

                    debug("local-signup");

                    const firstname = req.body.firstname || '';
                    const lastname = req.body.lastname || '';
                    const email = req.body.email || '';

                    process.nextTick(function () {
                        // find a user whose username is the same as the forms username
                        // we are checking to see if the user trying to login already exists
                        User.findByUsername(username, function (err, user) {
                            // if there are any errors, return the error
                            if (err) {
                                debug(err);
                                return done(err);
                            }

                            // check to see if there is already a user with that email
                            if (user) {
                                debug('That username already exists.');
                                return done(null, false, 'That username already exists.');
                            } else {

                                // if there is no user with that username
                                // create the user
                                var newUser = new User({
                                    local: {
                                        username: username,
                                        password: password,
                                        firstname: firstname,
                                        lastname: lastname,
                                        email: email
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
                    usernameField: 'username',
                    passwordField: 'password',
                    passReqToCallback: true
                },
                function (req, username, password, done) {

                    debug("local-login");
                    // find a user whose username is the same as the forms username
                    // we are checking to see if the user trying to login already exists
                    User.findByUsername(username, function (err, user) {
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

        })
        .catch(err => {
            debug(err);
        });


}