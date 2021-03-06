import DbMyCalibre from "./models/dbMyCalibre";

//const JwtStrategy = require('passport-jwt').Strategy;
//const JwtExtractor = require('passport-jwt').ExtractJwt;
const BearerStrategy = require('passport-http-bearer').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GoogleIdTokenStrategy = require('passport-google-id-token');

const LocalStrategy = require('passport-local').Strategy;

const debug = require('debug')('server:config:passport');

import {User} from "./models/user";


module.exports = function (passport) {

  DbMyCalibre.getConf()
    .then(config => {
      // =========================================================================
      // passport session setup ==================================================
      // =========================================================================
      // required for persistent login sessions
      // passport needs ability to serialize and unserialize users out of session

      // used to serialize the user for the session
      passport.serializeUser(function (user, done) {
        //debug("1");
        //debug(user);
        done(null, user.id);
      });

      // used to deserialize the user
      passport.deserializeUser(function (id, done) {
        //debug("2");
        //debug(email);
        User.findById(id, function (err, user) {
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

            if (request.body.username && request.body.password) {
              // if we are connecting user... do it
              process.nextTick(function () {
                // find a user whose username is the same as the forms username
                // we are checking to see if the user trying to login already exists
                User.findByUsername(request.body.username, function (err, user) {
                  // if there are any errors, return the error
                  if (err) {
                    debug(err);
                    return done(err);
                  }

                  // check to see if there is already a user with that email
                  if (user) {
                    // It's an existing user... check the password... and if ok, merge them
                    if (!user.validPassword(request.body.password)) {
                      return done(null, false, 'Your user or your password is wrong.');
                    }

                    User.mergeAndSave(
                      request.user,
                      user,
                      function (err) {
                        if (err) {
                          return done(err);
                        }
                        request.user.updateLastConnection();
                        return done(null, request.user);
                      });
                  } else {

                    User.mergeAndSave(
                      request.user,
                      new User({
                        local: {
                          username: request.body.username,
                          password: request.body.password,
                        }
                      }),
                      function (err) {
                        if (err) {
                          return done(err);
                        }
                        request.user.updateLastConnection();
                        return done(null, request.user);
                      });
                  }

                });

              });

            } else {
              // debug(request.user.local);

              // Just logging... we are done
              request.user.updateLastConnection();
              return done(null, request.user);
            }
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
          debug(req.user);

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
                const newUser = new User({
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

      // =========================================================================
      // FACEBOOK ================================================================
      // =========================================================================
      config.authent_facebook_callbackURL = 'https://bib.bibulle.fr/assets/logged.html';
      // TODO : Edit in database
      passport.use(new FacebookStrategy({
          clientID: config.authent_facebook_clientID,
          clientSecret: config.authent_facebook_clientSecret,
          callbackURL: config.authent_facebook_callbackURL
        },
        // facebook will send back the token and profile
        function (token, refreshToken, profile, done) {
          // asynchronous
          process.nextTick(function () {
            // find the user in the database based on their facebook id
            User.findByFacebookId(profile.id, function (err, user) {

              // if there is an error, stop everything and return that
              // ie an error connecting to the database
              if (err)
                return done(err);

              // if the user is found, then log them in
              if (user) {
                return done(null, user); // user found, return that user
              } else {
                // if there is no user found with that facebook id, create them
                const firstName = profile.name.givenName || profile.displayName.replace(/ [^ ]*$/, '');
                const lastName = profile.name.familyName || profile.displayName.replace(/^.* /, '');
                let email = null;
                if (profile.emails) {
                  email = profile.emails[0].value;
                }

                const newUser = new User({
                  local: {
                    firstname: firstName,
                    lastname: lastName,
                    email: email
                  },
                  facebook: {
                    id: profile.id, // set the users facebook id
                    token: token, // we will save the token that facebook provides to the user
                    name: profile.displayName,
                    email: email
                  }
                });

                // save our user to the database
                newUser.save(function (err) {
                  if (err)
                    throw err;

                  // if successful, return the new user
                  return done(null, newUser);
                });
              }

            });
          });

        }));

      // =========================================================================
      // GOOGLE (through HTTP and redirect) ======================================
      // =========================================================================
      passport.use(new GoogleStrategy({
        clientID: config.authent_google_clientID,
        clientSecret: config.authent_google_clientSecret,
        callbackURL: config.authent_google_callbackURL
      },
      function (token, tokenSecret, profile, done) {
        //console.log(token);
        //console.log(tokenSecret);
        //console.log(profile);

        // make the code asynchronous
        process.nextTick(function () {

          User.findByGoogleId(profile.id, function (err, user) {

            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
              return done(err);

            // if the user is found then log them in
            if (user) {
              return done(null, user); // user found, return that user
            } else {
              //debug(user);
              // if there is no user, create them
              const firstName = profile.name.givenName || profile.displayName.replace(/ [^ ]*$/, '');
              const lastName = profile.name.familyName || profile.displayName.replace(/^.* /, '');
              let email = null;
              if (profile.emails) {
                email = profile.emails[0].value;
              }

              const newUser = new User({
                local: {
                  username: profile.username,
                  firstname: firstName,
                  lastname: lastName,
                  email: email
                },
                google: {
                  id: profile.id, // set the users facebook id
                  token: token, // we will save the token that facebook provides to the user
                  name: profile.displayName,
                  email: email
                }
              });

              //debug(user);

              // save our user into the database
              newUser.save(function (err) {
                if (err)
                  throw err;
                return done(null, newUser);
              });
            }

          });

        });

      }));

      // =========================================================================
      // GOOGLE (with android idToken) ===========================================
      // =========================================================================
      passport.use(new GoogleIdTokenStrategy({
        clientID: config.authent_google_android_clientID,
        clientSecret: config.authent_google_android_clientSecret,
        // clientID: "725701605591-rr2dqeabon4kjpfevoruru65eo3rukmv.apps.googleusercontent.com",
        // clientSecret: "SsLd5OpwpWbTcyUoakBYvTDm",
        callbackURL: config.authent_google_callbackURL
      },
      function (decoded, tokenId, done) { 
        // console.log(decoded);
        // console.log(tokenId);

        let profile = decoded.payload;

        // make the code asynchronous
        process.nextTick(function () {

          User.findByGoogleId(tokenId, function (err, user) {

            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
              return done(err);

            // if the user is found then log them in
            if (user) {
              return done(null, user); // user found, return that user
            } else {
              //debug(user);
              // if there is no user, create them
              const firstName = profile.given_name || profile.name.replace(/ [^ ]*$/, '');
              const lastName = profile.family_name || profile.name.replace(/^.* /, '');
              let email = profile.email;

              const newUser = new User({
                local: {
                  username: profile.username,
                  firstname: firstName,
                  lastname: lastName,
                  email: email
                },
                google: {
                  id: profile.sub, // set the users google id
                  //token: token, // we will save the token that google provides to the user
                  name: profile.name,
                  email: email
                }
              });

              //debug(user);

              // save our user into the database
              newUser.save(function (err) {
                if (err)
                  throw err;
                return done(null, newUser);
              });
            }

          });

        });

      }));
  User.init();

    })
    .catch(err => {
      debug(err);
    })
  ;


};
