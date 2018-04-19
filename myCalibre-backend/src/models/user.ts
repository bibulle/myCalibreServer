import * as _ from "lodash";
import {randomBytes, pbkdf2Sync} from "crypto";
import {sign, verify} from "jsonwebtoken";

import DbMyCalibre from "./dbMyCalibre";
import {Configuration} from "./configuration";

const debug = require('debug')('server:model:user');


export class User {

  id: string;
  created: Date;
  updated: Date;

  local: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    isAdmin: boolean;
    hashedPassword: string,
    salt: string,
    amazonEmails: string[]
  } = {
    username: null,
    firstname: null,
    lastname: null,
    email: null,
    isAdmin: null,
    hashedPassword: null,
    salt: null,
    amazonEmails: []
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

    // debug(options);
    // TODO : Remove this part when data will be migrated
    var oldFormat = false;
    if (!options['local']) {
      oldFormat = true;
      options['local'] = {
        username: options['local_username'],
        firstname: options['local_firstname'],
        lastname: options['local_lastname'],
        email: options['local_email'],
        isAdmin: options['local_isAdmin'],
        hashedPassword: options['local_hashedPassword'],
        salt: options['local_salt'],
        amazonEmails: options['local_amazon_emails']
      }
    }
    if (!options['facebook']) {
      options['facebook'] = {
        id: options['facebook_id'],
        token: options['facebook_token'],
        email: options['facebook_email'],
        name: options['facebook_name']
      }
    }
    if (!options['twitter']) {
      options['twitter'] = {
        id: options['twitter_id'],
        token: options['twitter_token'],
        displayName: options['twitter_displayName'],
        username: options['twitter_username']
      }
    }
    if (!options['google']) {
      options['google'] = {
        id: options['google_id'],
        token: options['google_token'],
        email: options['google_email'],
        name: options['google_name']
      }
    }
    delete options['local_username'];
    delete options['local_firstname'];
    delete options['local_lastname'];
    delete options['local_email'];
    delete options['local_isAdmin'];
    delete options['local_hashedPassword'];
    delete options['local_salt'];
    delete options['local_amazon_emails'];
    delete options['facebook_id'];
    delete options['facebook_token'];
    delete options['facebook_email'];
    delete options['facebook_name'];
    delete options['twitter_id'];
    delete options['twitter_token'];
    delete options['twitter_displayName'];
    delete options['twitter_username'];
    delete options['google_id'];
    delete options['google_token'];
    delete options['google_email'];
    delete options['google_name'];
    if (typeof options['created'] === "string") {
      options['created'] = new Date(options['created']);
    }
    if (typeof options['updated'] === "string") {
      options['updated'] = new Date(options['updated']);
    }
    // TODO END : Remove this part when data will be migrated

    // Manage special types (string array, boolean, ...
    if (typeof options['local']['amazonEmails'] === "string") {
      options['local']['amazonEmails'] = options['local']['amazonEmails'].split("|").filter(s => s.trim() != "");
    }
    if (typeof options['local']['isAdmin'] !== 'boolean') {
      options['local']['isAdmin'] = (options['local']['isAdmin'] === 1);
    }
    delete options['_id'];


    _.merge(this, options);

    // TODO : Remove this part when data will be migrated
    if (oldFormat) {
      DbMyCalibre.saveUser(this, false)
        .catch(err => {
          debug(err)
        });
    }
    // TODO END : Remove this part when data will be migrated
    // debug(options);
    if (!this.local.salt) {
      this.local.salt = User.generateSalt();
    }
    if (this.local['password']) {
      this.local.hashedPassword = this.generateHash(this.local['password']);
      delete this.local['password'];
    }

    if (!options['id']) {
      this.id = User.generateSalt();
    }


  }


  static findById(id: string, callback: (err: Error, user: User) => any) {
    DbMyCalibre
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
    DbMyCalibre
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
    DbMyCalibre
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
    DbMyCalibre
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
    DbMyCalibre
      .saveUser(this, true)
      .then(() => {
        callback(null);
      })
      .catch(err => {
        debug(err);
        callback(err);
      })

  }

  remove(callback: (err: Error) => any) {
    DbMyCalibre
      .deleteUser(this)
      .then(() => {
        callback(null);
      })
      .catch(err => {
        debug(err);
        callback(err);
      })

  }

  static mergeAndSave(trg: User, src: User, done: (err: Error) => (any)) {

    // the salt must be transferred sometime
    if (!trg.local.hashedPassword && src.local.hashedPassword) {
      trg.local.salt = src.local.salt;
    }

    //debug(src.local);
    //debug(trg.local);
    _.mergeWith(trg.local, src.local, (objValue, srcValue) => {
      if (objValue) {
        return objValue
      } else {
        return srcValue
      }
    });
    _.mergeWith(trg.facebook, src.facebook, (objValue, srcValue) => {
      if (objValue) {
        return objValue
      } else {
        return srcValue
      }
    });
    _.mergeWith(trg.twitter, src.twitter, (objValue, srcValue) => {
      if (objValue) {
        return objValue
      } else {
        return srcValue
      }
    });
    _.mergeWith(trg.google, src.google, (objValue, srcValue) => {
      if (objValue) {
        return objValue
      } else {
        return srcValue
      }
    });

    src.remove((err) => {
      if (err) {
        return done(err);
      } else {
        trg.save(done);
      }
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
    return sign(_.pick(user, ['id', 'local.username', 'local.firstname', 'local.lastname', 'local.email', 'local.isAdmin', 'local.amazonEmails', 'facebook', 'twitter', 'google']), User.conf.authent_secret, {expiresIn: "7d"});
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
    DbMyCalibre
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

