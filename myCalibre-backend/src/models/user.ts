import * as _ from "lodash";
import {randomBytes, pbkdf2Sync} from "crypto";
import {sign, verify} from "jsonwebtoken";

import DbMyCalibre from "./dbMyCalibre";
import {Configuration} from "./configuration";

const debug = require('debug')('server:model:user');


export class User {

  id: string;

  local: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    isAdmin: boolean;
    hashedPassword: string,
    salt: string
  } = {
    username: null,
    firstname: null,
    lastname: null,
    email: null,
    isAdmin: null,
    hashedPassword: null,
    salt: null
  };

  facebook: {
    id: string,
    token: string,
    email: string,
    name: string,
  } = {
    id: null,
    token: null,
    email: null,
    name: null
  };

  twitter: {
    id: string,
    token: string,
    displayName: string,
    username: string,
  } = {
    id: null,
    token: null,
    displayName: null,
    username: null
  };

  google: {
    id: string,
    token: string,
    email: string,
    name: string,
  } = {
    id: null,
    token: null,
    email: null,
    name: null
  };

  static conf: Configuration;

  constructor(options: {}) {

    _.merge(this, options);

    //debug(options);
    if (!this.local.salt) {
      this.local.salt = User.generateSalt();
    }
    if (this.local['password']) {
      this.local.hashedPassword = this.generateHash(this.local['password']);
      delete this.local['password'];
    }
    //debug(this);

    if (!options['id']) {
      this.id = User.generateSalt();
    }
  }


  static findById(id: string, callback: (err: Error, user: User) => any) {
    DbMyCalibre.getInstance()
      .findUserById(id)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        debug(err);
        callback(err, null);
      })
  }

  static findByUsername(username: string, callback: (err: Error, user: User) => any) {
    DbMyCalibre.getInstance()
      .findUserByUsername(username)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        debug(err);
        callback(err, null);
      })
  }

  static findByFacebookId(facebookId: string, callback: (err: Error, user: User) => any) {
    DbMyCalibre.getInstance()
      .findByFacebookId(facebookId)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        //debug(err);
        callback(err, null);
      })
  }

  static findByGoogleId(googleId: string, callback: (err: Error, user: User) => any) {
    DbMyCalibre.getInstance()
      .findByGoogleId(googleId)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        //debug(err);
        callback(err, null);
      })
  }

  save(callback: (err: Error) => any) {
    DbMyCalibre.getInstance()
      .saveUser(this, true)
      .then(() => {
        callback(null);
      })
      .catch(err => {
        debug(err);
        callback(err);
      })

  }

  validPassword(password: string): boolean {
    const hash = this.generateHash(password);

    return (this.local.hashedPassword === hash);
  }


  /**
   * Create e JWT token
   * @param user
   * @returns {string|void}
   */
  static createToken(user): string {
    return sign(_.pick(user, ['id', 'local.username', 'local.firstname', 'local.lastname', 'local.email', 'local.isAdmin', 'facebook', 'twitter', 'google']), User.conf.authent_secret, {expiresIn: "7d"});
  }

  /**
   * Check tocken
   * @param token
   * @param done callback (err, user)
   */
  static checkToken(token, done: (err: Error, user: User) => any): void {
    return verify(token, User.conf.authent_secret, (err, decoded) => {
      if (err) {
        return done(err, null);
      }
      //debug(decoded);
      User.findById(decoded.id, (err, user) => {
        if (err) {
          done(err, null);
        } else {
          done(null, user);
        }

      })
    });
  }

  private generateHash(password: string): string {
    return pbkdf2Sync(password, this.local.salt, 10000, User.conf.authent_length, User.conf.authent_digest).toString("hex");
  }

  private static generateSalt(): string {
    return randomBytes(128).toString("base64")
  }


  static init() {
    debug("init...");
    DbMyCalibre.getInstance()
      .getConf()
      .then(conf => {
        User.conf = conf;
        debug("init...done");

        //User.findByEmail("", (err, user) => {
        //  debug(err);
        //  debug(user);
        //});
        //User.findByEmail("eric@eric.fr", (err, user) => {
        //  debug(err);
        //  debug(user);
        //});
        //var user = new User({
        //  local : {
        //    email : "eric@eric.fr",
        //    password: "eric"
        //  }
        //});

        //user.save((err) => {
        //  debug(err);
        //})

      })
      .catch(err => {
        debug(err);
      })
  }

}

