import { BookData } from './book';

export class User {
  id?: string;
  created?: Date;
  updated?: Date;

  local: {
    username?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    isAdmin?: boolean;
    hashedPassword?: string;
    salt?: string;
    amazonEmails?: string[];
  } = {};

  facebook: {
    id?: string;
    token?: string;
    email?: string;
    name?: string;
  } = {};

  twitter: {
    id?: string;
    token?: string;
    displayName?: string;
    username?: string;
  } = {};

  google: {
    id?: string;
    token?: string;
    email?: string;
    name?: string;
  } = {};

  history: {
    lastConnection: Date;
    downloadedBooks: BookDownloaded[];
    ratings: BookRating[];
  } = {
    lastConnection: new Date(1900, 0, 1),
    downloadedBooks: [],
    ratings: [],
  };

  private constructor() {
    throw new Error('Not to be called !!');
  }

  //   static findById(id: string, callback: (err: Error, user: User) => any) {
  //     DbMyCalibre
  //       .findUserById(id)
  //       .then(user => {
  //         callback(null, user);
  //       })
  //       .catch(err => {
  //         debug(err);
  //         callback(err, null);
  //       })
  //   }

  //   static findByFacebookId(facebookId: string, callback: (err: Error, user: User) => any) {
  //     DbMyCalibre
  //       .findByFacebookId(facebookId)
  //       .then(user => {
  //         callback(null, user);
  //       })
  //       .catch(err => {
  //         //debug(err);
  //         callback(err, null);
  //       })
  //   }

  //   static findByGoogleId(googleId: string, callback: (err: Error, user: User) => any) {
  //     DbMyCalibre
  //       .findByGoogleId(googleId)
  //       .then(user => {
  //         callback(null, user);
  //       })
  //       .catch(err => {
  //         //debug(err);
  //         callback(err, null);
  //       })
  //   }

  //   save(callback: (err: Error) => any, changeUpdateDate = true) {
  //     DbMyCalibre
  //       .saveUser(this, true, changeUpdateDate)
  //       .then(() => {
  //         callback(null);
  //       })
  //       .catch(err => {
  //         debug(err);
  //         callback(err);
  //       })

  //   }

  //   remove(callback: (err: Error) => any) {
  //     DbMyCalibre
  //       .deleteUser(this)
  //       .then(() => {
  //         callback(null);
  //       })
  //       .catch(err => {
  //         debug(err);
  //         callback(err);
  //       })

  //   }

  //   static mergeAndSave(trg: User, src: User, done: (err: Error) => (any)) {

  //     // the salt must be transferred sometime
  //     if (!trg.local.hashedPassword && src.local.hashedPassword) {
  //       trg.local.salt = src.local.salt;
  //     }

  //     // get the older created
  //     if (src.created.getTime() < trg.created.getTime()) {
  //       trg.created = src.created;
  //     }

  //     //debug(src.local);
  //     //debug(trg.local);
  //     _.mergeWith(trg.local, src.local, (objValue, srcValue) => {
  //       if (objValue) {
  //         return objValue
  //       } else {
  //         return srcValue
  //       }
  //     });
  //     _.mergeWith(trg.facebook, src.facebook, (objValue, srcValue) => {
  //       if (objValue) {
  //         return objValue
  //       } else {
  //         return srcValue
  //       }
  //     });
  //     _.mergeWith(trg.twitter, src.twitter, (objValue, srcValue) => {
  //       if (objValue) {
  //         return objValue
  //       } else {
  //         return srcValue
  //       }
  //     });
  //     _.mergeWith(trg.google, src.google, (objValue, srcValue) => {
  //       if (objValue) {
  //         return objValue
  //       } else {
  //         return srcValue
  //       }
  //     });

  //     src.remove((err) => {
  //       if (err) {
  //         return done(err);
  //       } else {
  //         trg.save(done);
  //       }
  //     });

  //     // in history, more complicated
  //     // get the most recent connection
  //     if (src.history.lastConnection) {
  //       if (!trg.history.lastConnection || (src.history.lastConnection > trg.history.lastConnection)) {
  //         trg.history.lastConnection = src.history.lastConnection;
  //       }
  //     }
  //     // concat the downloaded books
  //     for (let i = 0; i < src.history.downloadedBooks.length; i++) {
  //       const srcId = src.history.downloadedBooks[i].id;
  //       let found = false;
  //       for (let j = 0; j < trg.history.downloadedBooks.length; j++) {
  //         if (trg.history.downloadedBooks[j].id === srcId) {
  //           found = true;
  //           break;
  //         }
  //       }
  //       if (!found) {
  //         trg.history.downloadedBooks.push(src.history.downloadedBooks[i]);
  //       }
  //     }
  //     // concat the rating
  //     for (let i = 0; i < src.history.ratings.length; i++) {
  //       const srcId = src.history.ratings[i].book_id;
  //       let found = false;
  //       for (let j = 0; j < trg.history.ratings.length; j++) {
  //         if (trg.history.ratings[j].book_id === srcId) {
  //           found = true;
  //           // get the most recent
  //           if (src.history.ratings[i].date > trg.history.ratings[j].date) {
  //             trg.history.ratings[j].date = src.history.ratings[i].date;
  //             trg.history.ratings[j].rating = src.history.ratings[i].rating;
  //           }
  //           break;
  //         }
  //       }
  //       if (!found) {
  //         trg.history.ratings.push(src.history.ratings[i]);
  //       }
  //     }

  //   }

  //   validPassword(password: string): boolean {
  //     const hash = this.generateHash(password);

  //     return (this.local.hashedPassword === hash);
  //   }

  //   updateLastConnection() {
  //     this.history.lastConnection = new Date();
  //     this.save(err => {
  //       if (err) {
  //         debug(err);
  //       }
  //     }, false)
  //   }

  //   addRatingBook(book_id: number, bookName: string, rating: number, done: (err: Error, info: string) => any) {

  //     let found = false;
  //     let change = false;
  //     for (let i = 0; i < this.history.ratings.length; i++) {
  //       const book = this.history.ratings[i];
  //       if (book.book_id === book_id) {
  //         found = true;
  //         if (book.rating !== rating) {
  //           change = true;
  //           book.rating = rating;
  //           book.date = new Date();
  //         }
  //         break;
  //       }
  //     }

  //     if (!found) {
  //       this.history.ratings.push({
  //         book_id: book_id,
  //         rating: rating,
  //         book_name: bookName,
  //         date: new Date()
  //       });
  //       this.history.ratings.sort((a,b) => {
  //         if (a.date.getTime() < b.date.getTime()) {
  //           return -1;
  //         } else {
  //           return 1;
  //         }
  //       });
  //       this.save(
  //         err => {
  //           done(err, "SAVED")
  //         }, true)
  //     } else if (change) {
  //       this.save(
  //         err => {
  //           done(err, "CHANGED")
  //         }, true)
  //     } else {
  //       done(null, "NOTHING_TO_DO")
  //     }

  //   }

  //   addDownloadedBook(book_id: number, bookDatum: BookData) {

  //     let found = false;
  //     for (let i = 0; i < this.history.downloadedBooks.length; i++) {
  //       const book = this.history.downloadedBooks[i];
  //       if (book.id === book_id) {
  //         found = true;
  //         break;
  //       }
  //     }

  //     if (!found) {
  //       this.history.downloadedBooks.push({
  //         id: book_id,
  //         data: bookDatum,
  //         date: new Date()
  //       });
  //       this.history.downloadedBooks.sort((a,b) => {
  //         if (typeof a.date === "string") {
  //           a.date = new Date(a.date);
  //         }
  //         if (typeof b.date === "string") {
  //           b.date = new Date(b.date);
  //         }
  //         if (a.date.getTime() < b.date.getTime()) {
  //           return -1;
  //         } else {
  //           return 1;
  //         }
  //       });
  //       this.save(err => {
  //         if (err) {
  //           debug(err);
  //         }
  //       }, true)
  //     }

  //   }

  //   /**
  //    * Create e JWT token
  //    * @param user
  //    * @returns {string|void}
  //    */
  //   static createToken(user): string {
  //     const sendUser = _.pick(user, ['id', 'created', 'updated', 'local.username', 'local.firstname', 'local.lastname', 'local.email', 'local.isAdmin', 'local.amazonEmails', 'facebook', 'twitter', 'google', 'history']);

  //     delete sendUser.facebook.token;
  //     delete sendUser.google.token;
  //     delete sendUser.twitter.token;
  //     delete sendUser.history.downloadedBooks;
  //     delete sendUser.history.ratings;

  //     return sign(sendUser, User.conf.authent_secret, {expiresIn: "7d"});
  //   }

  //   /**
  //    * Create e JWT token (temporary one)
  //    * @param user
  //    * @returns {string|void}
  //    */
  //   static createTemporaryToken(user): string {
  //     return sign(_.pick(user, ['id']), User.conf.authent_secret, {expiresIn: "5s"});
  //   }

  //   /**
  //    * Check tocken
  //    * @param token
  //    * @param done callback (err, user)
  //    */
  //   static checkToken(token, done: (err: Error, user: User) => any): void {
  //     return verify(token, User.conf.authent_secret, (err, decoded) => {
  //       if (err) {
  //         return done(err, null);
  //       }
  //       //debug(decoded);
  //       User.findById(decoded.id, (err, user) => {
  //         if (err) {
  //           done(err, null);
  //         } else {
  //           done(null, user);
  //         }

  //       })
  //     });
  //   }

  //   private generateHash(password: string): string {
  //     return pbkdf2Sync(password, this.local.salt, 10000, User.conf.authent_length, User.conf.authent_digest).toString("hex");
  //   }

  //   private static generateSalt(): string {
  //     return randomBytes(128).toString("base64")
  //   }

  //   static init() {
  //     debug("init...");
  //     DbMyCalibre
  //       .getConf()
  //       .then(conf => {
  //         User.conf = conf;
  //         debug("init...done");

  //         //User.findByEmail("", (err, user) => {
  //         //  debug(err);
  //         //  debug(user);
  //         //});
  //         //User.findByEmail("eric@eric.fr", (err, user) => {
  //         //  debug(err);
  //         //  debug(user);
  //         //});
  //         //var user = new User({
  //         //  local : {
  //         //    email : "eric@eric.fr",
  //         //    password: "eric"
  //         //  }
  //         //});

  //         //user.save((err) => {
  //         //  debug(err);
  //         //})

  //       })
  //       .catch(err => {
  //         debug(err);
  //       })
  //   }

  // }
}
export class BookDownloaded {
  date: Date | undefined;
  id = 0;
  data: BookData | undefined;
}
export class BookRating {
  date: Date | undefined;
  rating: number | undefined;
  book_id = 0;
  book_name: string | undefined;
}

export class UserAPI {
  id?: string;
  created?: Date;
  updated?: Date;

  local: {
    username?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    isAdmin?: boolean;
    amazonEmails?: string[];
  } = {};

  facebook: {
    id?: string;
    email?: string;
    name?: string;
  } = {};

  twitter: {
    id?: string;
    displayName?: string;
    username?: string;
  } = {};

  google: {
    id?: string;
    email?: string;
    name?: string;
  } = {};

  history: {
    lastConnection: Date;
    downloadedBooks: BookDownloaded[];
    ratings: BookRating[];
  } = {
    lastConnection: new Date(1900, 0, 1),
    downloadedBooks: [],
    ratings: [],
  };

  private constructor() {
    throw new Error('Not to be called !!');
  }

}
