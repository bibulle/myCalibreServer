import { BookData, User, UserAPI } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import * as _ from 'lodash';
import { MyCalibreDbService } from '../database/my-calibre-db.service';

// import { Provider } from '../authentication/authentication.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  users: { [id: string]: User } = {};

  constructor(private configService: ConfigService, private myCalibreService: MyCalibreDbService) {}

  async getAll(): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
      this.myCalibreService
        .getAllUsers()
        .then((docs) => {
          if (!docs) {
            return resolve(null);
          } else {
            return resolve(docs.map((doc) => this.createUser(doc)));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }

  async findByUsername(username: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.myCalibreService
        .findUserByUsername(username)
        .then((doc) => {
          if (!doc) {
            return resolve(null);
          } else {
            return resolve(this.createUser(doc));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async findById(userId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.myCalibreService
        .findUserById(userId)
        .then((doc) => {
          if (!doc) {
            return resolve(null);
          } else {
            // this.logger.debug(doc);
            return resolve(this.createUser(doc));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async findByGoogleId(userId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.myCalibreService
        .findUserByGoogleId(userId)
        .then((doc) => {
          if (!doc) {
            return resolve(null);
          } else {
            return resolve(this.createUser(doc));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async findByFacebookId(userId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.myCalibreService
        .findUserByFacebookId(userId)
        .then((doc) => {
          if (!doc) {
            return resolve(null);
          } else {
            return resolve(this.createUser(doc));
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async saveUser(user: User, changeUpdateDate = true): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.myCalibreService
        .saveUser(user, true, changeUpdateDate)
        .then((doc) => {
          if (!doc) {
            return resolve(null);
          } else {
            // this.logger.debug(JSON.stringify(doc, null, 2))
            return resolve(user);
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async deleteUser(userId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.myCalibreService
        .deleteUser(userId)
        .then((doc) => {
          if (!doc) {
            return resolve();
          } else {
            // this.logger.debug(JSON.stringify(doc, null, 2))
            return resolve();
          }
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async resetUserPassword(userId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.findById(userId)
        .then((modifiedUser) => {
          if (!modifiedUser) {
            return reject('User not found');
          }
          // generate a password
          let newPassword = (Math.random() * 100000).toFixed(0) + '';
          while (newPassword.length < 5) newPassword = '0' + newPassword;

          modifiedUser.local['password'] = newPassword;
          const newUser = this.createUser(modifiedUser);

          this.saveUser(newUser, true)
            .then(() => {
              resolve(newPassword);
            })
            .catch((err) => {
              this.logger.error(err);
              return reject(err);
            });
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }
  async mergeUsers(userSrcId: string, userTrgId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.findById(userSrcId), this.findById(userTrgId)])
        .then((users) => {
          if ((!users && users.length !== 2 && !users[0]) || !users[1]) {
            return reject('User not found');
          }

          const userSrc = users[0];
          const userTrg = users[1];

          this.mergeAndSaveUsers(userSrc, userTrg)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              this.logger.error(err);
              return reject(err);
            });
        })
        .catch((err) => {
          this.logger.error(err);
          return reject(err);
        });
    });
  }

  async mergeAndSaveUsers(userSrc: User, userTrg: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // the salt must be transferred sometime
      if (!userTrg.local.hashedPassword && userSrc.local.hashedPassword) {
        userTrg.local.salt = userSrc.local.salt;
      }

      // get the older created
      if (userSrc.created.getTime() < userTrg.created.getTime()) {
        userTrg.created = userSrc.created;
      }

      // this.logger.debug(userSrc.local);
      // this.logger.debug(userTrg.local);
      _.mergeWith(userTrg.local, userSrc.local, (objValue, srcValue) => {
        if (objValue) {
          return objValue;
        } else {
          return srcValue;
        }
      });
      // this.logger.debug(userSrc.facebook);
      // this.logger.debug(userTrg.facebook);
      _.mergeWith(userTrg.facebook, userSrc.facebook, (objValue, srcValue) => {
        if (objValue) {
          return objValue;
        } else {
          return srcValue;
        }
      });
      // this.logger.debug(userSrc.twitter);
      // this.logger.debug(userTrg.twitter);
      _.mergeWith(userTrg.twitter, userSrc.twitter, (objValue, srcValue) => {
        if (objValue) {
          return objValue;
        } else {
          return srcValue;
        }
      });
      // this.logger.debug(userSrc.google);
      // this.logger.debug(userTrg.google);
      _.mergeWith(userTrg.google, userSrc.google, (objValue, srcValue) => {
        if (objValue) {
          return objValue;
        } else {
          return srcValue;
        }
      });

      // in history, more complicated
      // get the most recent connection
      if (userSrc.history.lastConnection) {
        if (!userTrg.history.lastConnection || userSrc.history.lastConnection > userTrg.history.lastConnection) {
          userTrg.history.lastConnection = userSrc.history.lastConnection;
        }
      }
      // concat the downloaded books
      if (!userSrc.history.downloadedBooks) {
        userSrc.history.downloadedBooks = [];
      }
      if (!userSrc.history.ratings) {
        userSrc.history.ratings = [];
      }
      if (!userTrg.history.downloadedBooks) {
        userTrg.history.downloadedBooks = [];
      }
      if (!userTrg.history.ratings) {
        userTrg.history.ratings = [];
      }
      for (let i = 0; i < userSrc.history.downloadedBooks.length; i++) {
        const srcId = userSrc.history.downloadedBooks[i].id;
        let found = false;
        for (let j = 0; j < userTrg.history.downloadedBooks.length; j++) {
          if (userTrg.history.downloadedBooks[j].id === srcId) {
            found = true;
            break;
          }
        }
        if (!found) {
          userTrg.history.downloadedBooks.push(userSrc.history.downloadedBooks[i]);
        }
      }
      // concat the rating
      for (let i = 0; i < userSrc.history.ratings.length; i++) {
        const srcId = userSrc.history.ratings[i].book_id;
        let found = false;
        for (let j = 0; j < userTrg.history.ratings.length; j++) {
          if (userTrg.history.ratings[j].book_id === srcId) {
            found = true;
            // get the most recent
            if (userSrc.history.ratings[i].date > userTrg.history.ratings[j].date) {
              userTrg.history.ratings[j].date = userSrc.history.ratings[i].date;
              userTrg.history.ratings[j].rating = userSrc.history.ratings[i].rating;
            }
            break;
          }
        }
        if (!found) {
          userTrg.history.ratings.push(userSrc.history.ratings[i]);
        }
      }

      this.deleteUser(userSrc.id)
        .then(() => {
          this.saveUser(userTrg, true)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  validPassword(user: User, password: string): boolean {
    const hash = this.generateHash(user, password);

    return user.local.hashedPassword === hash;
  }

  createToken(user: User): string {
    const sentUser = this.user2API(user);

    delete sentUser.history.downloadedBooks;
    delete sentUser.history.ratings;

    return sign(sentUser, this.configService.get('AUTHENT_JWT_SECRET'), { expiresIn: '7d' });
  }
  /**
   * Create e JWT token (temporary one)
   * @param user
   * @returns {string|void}
   */
  createTemporaryToken(user): string {
    return sign(_.pick(user, ['id']), this.configService.get('AUTHENT_JWT_SECRET'), { expiresIn: '5s' });
  }
  /**
   * Check tocken
   * @param token
   * @param done callback (err, user)
   */
  checkToken(token): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      verify(token, this.configService.get('AUTHENT_JWT_SECRET'), (err, decoded) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        }
        // this.logger.debug(decoded);
        this.findById(decoded.id)
          .then((user) => {
            // this.logger.debug(user);
            resolve(user);
          })
          .catch((err) => {
            this.logger.debug(err);
            reject(err);
          });
      });
    });
  }

  user2API(user: User): UserAPI {
    const sentUser = _.pick(user, [
      'id',
      'created',
      'updated',
      'local.username',
      'local.firstname',
      'local.lastname',
      'local.email',
      'local.isAdmin',
      'local.amazonEmails',
      'facebook',
      'twitter',
      'google',
      'history',
    ]);

    delete sentUser.facebook.token;
    delete sentUser.google.token;
    delete sentUser.twitter.token;

    return sentUser as UserAPI;
  }

  private generateHash(user: User, password: string): string {
    this.logger.debug(`pbkdf2Sync '${+this.configService.get('AUTHENT_LENGTH')}' '${this.configService.get('AUTHENT_DIGEST')}'`)
    return pbkdf2Sync(password, user.local.salt, 10000, +this.configService.get('AUTHENT_LENGTH'), this.configService.get('AUTHENT_DIGEST')).toString('hex');
  }
  private generateSalt(): string {
    return randomBytes(128).toString('base64');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public createUser(options: any): User {
    // this.logger.debug('createUser');
    // this.logger.debug(options);

    // add needed fields
    if (!options.local) {
      options.local = {};
    }
    if (!options.facebook) {
      options.facebook = {};
    }
    if (!options.twitter) {
      options.twitter = {};
    }
    if (!options.google) {
      options.google = {};
    }
    if (!options.history) {
      options.history = {
        lastConnection: new Date(1900, 0, 1),
        downloadedBooks: [],
        ratings: [],
      };
    }

    // Manage special types (string array, boolean, ...
    if (typeof options['local']['amazonEmails'] === 'string') {
      options['local']['amazonEmails'] = options['local']['amazonEmails'].split('|').filter((s) => s.trim() != '');
    }
    if (typeof options['local']['isAdmin'] !== 'boolean') {
      options['local']['isAdmin'] = options['local']['isAdmin'] === 1;
    }
    delete options['_id'];

    if (typeof options['created'] === 'string') {
      options['created'] = new Date(options['created']);
    }

    const user: User = options as User;

    if (user.history && user.history.downloadedBooks) {
      user.history.downloadedBooks.forEach((d) => {
        if (typeof d.date === 'string') {
          d.date = new Date(d.date);
        }
      });
    }
    if (user.history && user.history.ratings) {
      user.history.ratings.forEach((d) => {
        if (typeof d.date === 'string') {
          d.date = new Date(d.date);
        }
      });
    }

    if (!user.local.salt) {
      user.local.salt = this.generateSalt();
      // shouldBeSaved = true;
    }
    if (user.local['password']) {
      user.local.hashedPassword = this.generateHash(user, user.local['password']);
      delete user.local['password'];
      // shouldBeSaved = true;
    }

    if (!options['id']) {
      user.id = this.generateSalt();
      // shouldBeSaved = true;
    }

    // if (shouldBeSaved) {
    //   this.logger.debug("user should be saved");
    //   this.logger.debug(JSON.stringify(user, null, 2));
    // }

    return user;
  }

  updateLastConnection(user: User) {
    user.history.lastConnection = new Date();
    this.saveUser(user, false).catch((err) => {
      if (err) {
        this.logger.error(err);
      }
    });
  }
  addDownloadedBook(userIn: User, book_id: number, bookData: BookData) {

    this.findByUsername(userIn.id)
    .then(user => {
      if (!user.history.downloadedBooks) {
        user.history.downloadedBooks = [];
      }
  
      const bookDownloaded = user.history.downloadedBooks.find((bd) => {
        return bd.id === book_id;
      });
  
      if (!bookDownloaded) {
        user.history.downloadedBooks.push({
          id: book_id,
          data: bookData,
          date: new Date(),
        });
        user.history.downloadedBooks.sort((a, b) => {
          if (typeof a.date === 'string') {
            a.date = new Date(a.date);
          }
          if (typeof b.date === 'string') {
            b.date = new Date(b.date);
          }
          if (a.date.getTime() < b.date.getTime()) {
            return -1;
          } else {
            return 1;
          }
        });
        this.saveUser(user).catch((reason) => {
          this.logger.error(reason);
        });
      }
    })
    .catch(reason => {
      this.logger.error(reason);
    })
  }
  async addRatingBook(user: User, book_id: number, bookName: string, rating: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!user.history.ratings) {
        user.history.ratings = [];
      }
      let bookRating = user.history.ratings.find((br) => {
        return br.book_id === book_id;
      });
      if (!bookRating) {
        bookRating = {
          book_id: book_id,
          rating: undefined,
          date: undefined,
          book_name: bookName,
        };
        user.history.ratings.push(bookRating);
      }

      if (bookRating.rating !== rating) {
        bookRating.rating = rating;
        bookRating.date = new Date();
      }

      user.history.ratings.sort((a, b) => {
        if (typeof a.date === 'string') {
          a.date = new Date(a.date);
        }
        if (typeof b.date === 'string') {
          b.date = new Date(b.date);
        }
        if (a.date.getTime() < b.date.getTime()) {
          return -1;
        } else {
          return 1;
        }
      });

      this.saveUser(user)
        .then(() => {
          resolve();
        })
        .catch((reason) => {
          this.logger.error(reason);
          reject();
        });
    });
  }

  /**
   * get Bearer user from request if it exists
   * @param request
   * @param callback
   * @returns {any}
   * @private
   */
  async getBearerUser(request: Request): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      let token: string;
      if (request.headers && request.headers['authorization']) {
        const authorization: string = request.headers['authorization'];
        // if (typeof request.headers.authorization === "string") {
        //   authorization = request.headers.authorization;
        // }
        // this.logger.debug(authorization);
        const parts = authorization.split(' ');
        // console.log(parts);
        if (parts.length == 2) {
          const scheme = parts[0],
            credentials = parts[1];

          if (/^Bearer$/i.test(scheme)) {
            token = credentials;
          }
        }
      }
      // this.logger.debug(token);

      if (!token) {
        // this.logger.debug('reject');
        return reject('No token');
      }

      this.checkToken(token)
        .then((user) => {
          // this.logger.debug('resolve');
          resolve(user);
        })
        .catch((reason) => {
          // this.logger.debug('reject');
          reject(reason);
        });
    });
  }
}
