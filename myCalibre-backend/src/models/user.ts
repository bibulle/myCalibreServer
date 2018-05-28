import * as _ from "lodash";
import {pbkdf2Sync, randomBytes} from "crypto";
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
    downloadedBooks: DownloadedBook[],
    ratings: BookRating[]
  } = {
    lastConnection: null,
    downloadedBooks: [],
    ratings: []
  };

  static conf: Configuration;

  constructor(options: {}) {

    // debug(options);
    // TODO : Remove this part when data will be migrated
    let changed = false;
    if (options['history'] && options['history']['bookDownloaded']) {
      delete options['history']['bookDownloaded'];
      changed = true;
    }
    if (!options['history']) {
      changed = true;
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
    if (changed) {
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

    // get the older created
    if (src.created.getTime() < trg.created.getTime()) {
      trg.created = src.created;
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
    });

    // in history, more complicated
    // get the most recent connection
    if (src.history.lastConnection) {
      if (!trg.history.lastConnection || (src.history.lastConnection > trg.history.lastConnection)) {
        trg.history.lastConnection = src.history.lastConnection;
      }
    }
    // concat the downloaded books
    for (let i = 0; i < src.history.downloadedBooks.length; i++) {
      let srcId = src.history.downloadedBooks[i].id;
      let found = false;
      for (let j = 0; j < trg.history.downloadedBooks.length; j++) {
        if (trg.history.downloadedBooks[j].id === srcId) {
          found = true;
          break;
        }
      }
      if (!found) {
        trg.history.downloadedBooks.push(src.history.downloadedBooks[i]);
      }
    }
    // concat the rating
    for (let i = 0; i < src.history.ratings.length; i++) {
      let srcId = src.history.ratings[i].book_id;
      let found = false;
      for (let j = 0; j < trg.history.ratings.length; j++) {
        if (trg.history.ratings[j].book_id === srcId) {
          found = true;
          // get the most recent
          if (src.history.ratings[i].date > trg.history.ratings[j].date) {
            trg.history.ratings[j].date = src.history.ratings[i].date;
            trg.history.ratings[j].rating = src.history.ratings[i].rating;
          }
          break;
        }
      }
      if (!found) {
        trg.history.ratings.push(src.history.ratings[i]);
      }
    }

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

  addRatingBook(book_id: number, bookName: string, rating: number, done: (err: Error, info: string) => any) {

    let found = false;
    let change = false;
    for (let i = 0; i < this.history.ratings.length; i++) {
      let book = this.history.ratings[i];
      if (book.book_id === book_id) {
        found = true;
        if (book.rating !== rating) {
          change = true;
          book.rating = rating;
        }
        break;
      }
    }

    if (!found) {
      this.history.ratings.push({
        book_id: book_id,
        rating: rating,
        book_name: bookName,
        date: new Date()
      });
      this.history.ratings.sort((a,b) => {
        if (a.date.getTime() < b.date.getTime()) {
          return -1;
        } else {
          return 1;
        }
      });
      this.save(
        err => {
          done(err, "SAVED")
        }, true)
    } else if (change) {
      this.save(
        err => {
          done(err, "CHANGED")
        }, true)
    } else {
      done(null, "NOTHING_TO_DO")
    }




  }

  addDownloadedBook(book_id: number, bookDatum: BookData) {

    let found = false;
    for (let i = 0; i < this.history.downloadedBooks.length; i++) {
      let book = this.history.downloadedBooks[i];
      if (book.id === book_id) {
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
      this.history.downloadedBooks.sort((a,b) => {
        if (a.date.getTime() < b.date.getTime()) {
          return -1;
        } else {
          return 1;
        }
      });
      this.save(err => {
        if (err) {
          debug(err);
        }
      }, true)
    }


  }



  /**
   * Create e JWT token
   * @param user
   * @returns {string|void}
   */
  static createToken(user): string {
    let sendUser = _.pick(user, ['id', 'created', 'updated', 'local.username', 'local.firstname', 'local.lastname', 'local.email', 'local.isAdmin', 'local.amazonEmails', 'facebook', 'twitter', 'google', 'history']);

    delete sendUser.facebook.token;
    delete sendUser.google.token;
    delete sendUser.twitter.token;
    delete sendUser.history.downloadedBooks;
    delete sendUser.history.ratings;

    return sign(sendUser, User.conf.authent_secret, {expiresIn: "7d"});
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

export class DownloadedBook {
  date: Date;
  id: number;
  data: BookData;
}
export class BookRating {
  date: Date;
  rating: number;
  book_id: number;
  book_name: string;
}
