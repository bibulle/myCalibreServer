import * as _ from "lodash";
import {randomBytes, pbkdf2Sync} from "crypto";
import {sign, verify} from "jsonwebtoken";

import DbMyCalibre from "./dbMyCalibre";
import {Configuration} from "./configuration";
import {BookData} from "./book";

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

  history: {
    lastConnection: Date,
    downloadedBooks: Object[]
  } = {
    lastConnection: null,
    downloadedBooks: []
  };

  static conf: Configuration;

  constructor(options: {}) {

    // debug(options);
    // TODO : Remove this part when data will be migrated
    if (options['history'] && options['history']['bookDownloaded']) {
      delete options['history']['bookDownloaded'];
      DbMyCalibre.saveUser(this, false)
        .catch(err => {
          debug(err)
        });
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

  save(callback: (err: Error) => any, changeUpdateDate = true) {
    DbMyCalibre
      .saveUser(this, true, changeUpdateDate)
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

  updateLastConnection() {
    this.history.lastConnection = new Date();
    this.save(err => {
      if (err) {
        debug(err);
      }
    }, false)
  }

  addDownloadedBook(book_id: number, bookDatum: BookData) {

    let found = false;
    for (let i = 0; i < this.history.downloadedBooks.length; i++) {
      let book = this.history.downloadedBooks[i];
      if (book['id'] === book_id) {
        found = true;
        break;
      }
    }

    if (!found) {
      this.history.downloadedBooks.push({
        id: book_id,
        data: bookDatum,
        date: new Date()
      });
      this.save(err => {
        if (err) {
          debug(err);
        }
      }, false)
    }


  }



  /**
   * Create e JWT token
   * @param user
   * @returns {string|void}
   */
  static createToken(user): string {
    return sign(_.pick(user, ['id', 'created', 'updated', 'local.username', 'local.firstname', 'local.lastname', 'local.email', 'local.isAdmin', 'local.amazonEmails', 'facebook', 'twitter', 'google', 'history']), User.conf.authent_secret, {expiresIn: "7d"});
  }

  /**
   * Create e JWT token (temporary one)
   * @param user
   * @returns {string|void}
   */
  static createTemporaryToken(user): string {
    return sign(_.pick(user, ['id']), User.conf.authent_secret, {expiresIn: "5s"});
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

