import { User } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// import { Filter } from 'mongodb';
import * as mongoDB from 'mongodb';

@Injectable()
export class MyCalibreDbService {
  private readonly logger = new Logger(MyCalibreDbService.name);

  private static MONGO_URL: string;
  private static MONGO_DB_NAME: string;
  private static MONGO_USERS_COL_NAME: string;

  private collections: { users?: mongoDB.Collection } = {};

  constructor(private readonly _configService: ConfigService) {
    MyCalibreDbService.MONGO_URL = this._configService.get('MONGO_URL') || 'mongodb://192.168.0.126:30994';
    MyCalibreDbService.MONGO_DB_NAME = this._configService.get('MONGO_DB_NAME') || 'myCalibreDb';
    MyCalibreDbService.MONGO_USERS_COL_NAME = this._configService.get('MONGO_USERS_COL_NAME') || 'users';

    this._connectToDatabase();
  }

  private async _connectToDatabase() {
    if (!this.collections.users) {
      const client: mongoDB.MongoClient = new mongoDB.MongoClient(MyCalibreDbService.MONGO_URL);

      await client.connect();

      const db: mongoDB.Db = client.db(MyCalibreDbService.MONGO_DB_NAME);

      const gamesCollection: mongoDB.Collection = db.collection(MyCalibreDbService.MONGO_USERS_COL_NAME);

      this.collections.users = gamesCollection;

      this.logger.log(`Successfully connected to database: ${db.databaseName} and collection: ${gamesCollection.collectionName}`);
    }
  }

  /**
   * get a user from Db
   * @returns {Promise<User[]>}
   * @private
   */
  public getAllUsers(): Promise<mongoDB.Document[]> {
    return new Promise<mongoDB.Document[]>((resolve, reject) => {
      this._connectToDatabase();

      if (!this.collections.users) {
        reject('Cannot connect to Mongo !!');
      }

      this.collections.users
        .find({})
        .sort({ updated: -1 })
        .toArray((err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
    });
  }

  /**
   * get a user from Db
   * @param userId
   * @returns {Promise<User>}
   */
   public findUserById(userId: string): Promise<mongoDB.Document> {
    // this.logger.debug({ id: userId });
    return this._findUserBy({ id: userId });
  }
  public findUserByGoogleId(userId: string): Promise<mongoDB.Document> {
    return this._findUserBy({ 'google.id': userId });
  }
  public findUserByFacebookId(userId: string): Promise<mongoDB.Document> {
    return this._findUserBy({ 'facebook.id': userId });
  }
  public findByTemporaryToken(token: string): Promise<mongoDB.Document> {
    return this._findUserBy({ 'temporary_token': token });
  }

  /**
   * get a user from Db
   * @param username
   * @returns {Promise<User>}
   */
  public findUserByUsername(username: string): Promise<mongoDB.Document> {
    return this._findUserBy({ $or: [{ 'local.username': username }, { local_username: username }] });
  }

  public saveUser(user: User, tryInsert: boolean, changeUpdateDate = true): Promise<mongoDB.Document> {
    return new Promise((resolve, reject) => {
      this._connectToDatabase();
      if (!this.collections.users) {
        reject('Cannot connect to Mongo !!');
      }

      const filter: mongoDB.Filter<mongoDB.Document> = { id: user.id };

      if (!user.created) {
        user.created = new Date();
      }
      if (changeUpdateDate) {
        user.updated = new Date();
      }
      // translate date that where previously in string type
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
      delete user['_id'];

      this.collections.users
        .replaceOne(filter, user, { upsert: tryInsert })
        .then((doc) => {
          // this.logger.debug(JSON.stringify(doc, null, 2));
          resolve(doc);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
  public deleteUser(userId: string): Promise<mongoDB.Document> {
    return new Promise((resolve, reject) => {
      this._connectToDatabase();
      if (!this.collections.users) {
        reject('Cannot connect to Mongo !!');
      }

      const filter: mongoDB.Filter<mongoDB.Document> = { id: userId };

      this.collections.users
        .deleteOne(filter)
        .then((doc) => {
          // this.logger.debug(JSON.stringify(doc, null, 2));
          resolve(doc);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  /**
   * get a user from Db
   * @param {Object} query
   * @returns {Promise<User>}
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _findUserBy(query: any): Promise<mongoDB.Document> {
    return new Promise<mongoDB.Document>((resolve, reject) => {
      this._connectToDatabase();

      if (!this.collections.users) {
        reject('Cannot connect to Mongo !!');
      }

      // this.logger.debug(query);
      this.collections.users
        //.findOne({ '$or': [{ 'local.username': 'eric' }, { local_username: 'eric' }] })
        // eslint-disable-next-line @typescript-eslint/ban-types
        .findOne(query as {})
        .then((row) => {
          // this.logger.debug(JSON.stringify(row, null, 2));
          resolve(row);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
}
