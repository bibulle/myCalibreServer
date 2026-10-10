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
  // Connection attempt in progress, shared by all callers (only one MongoClient at a time)
  private _connecting: Promise<mongoDB.Collection> | null = null;
  private _lastConnectionError: string | null = null;

  constructor(private readonly _configService: ConfigService) {
    MyCalibreDbService.MONGO_URL = this._configService.get('MONGO_URL') || 'mongodb://192.168.0.126:30994';
    MyCalibreDbService.MONGO_DB_NAME = this._configService.get('MONGO_DB_NAME') || 'myCalibreDb';
    MyCalibreDbService.MONGO_USERS_COL_NAME = this._configService.get('MONGO_USERS_COL_NAME') || 'users';

    // Never let a failed (initial) connection become an unhandled rejection: it would kill the
    // process (and the pod would crash-loop while Mongo is down). The error is logged and the
    // connection is retried by the next call.
    this._connectToDatabase().catch(() => undefined);
  }

  /**
   * Get the users collection, connecting first if needed. Once connected, the driver handles
   * reconnections by itself; a failed connection attempt is retried on the next call.
   */
  private _connectToDatabase(): Promise<mongoDB.Collection> {
    if (this.collections.users) {
      return Promise.resolve(this.collections.users);
    }
    if (!this._connecting) {
      const client: mongoDB.MongoClient = new mongoDB.MongoClient(MyCalibreDbService.MONGO_URL);

      this._connecting = client
        .connect()
        .then(() => {
          const db: mongoDB.Db = client.db(MyCalibreDbService.MONGO_DB_NAME);
          const usersCollection: mongoDB.Collection = db.collection(MyCalibreDbService.MONGO_USERS_COL_NAME);

          this.collections.users = usersCollection;
          this._lastConnectionError = null;
          this.logger.log(`Successfully connected to database: ${db.databaseName} and collection: ${usersCollection.collectionName}`);
          return usersCollection;
        })
        .catch(async (err) => {
          this._lastConnectionError = err?.message ?? `${err}`;
          this.logger.error(`Cannot connect to Mongo : ${this._lastConnectionError}`);
          await client.close().catch(() => undefined);
          throw err;
        })
        .finally(() => {
          this._connecting = null;
        });
    }
    return this._connecting;
  }

  /**
   * Users collection, or the historical 'Cannot connect to Mongo !!' rejection
   */
  private _getUsers(): Promise<mongoDB.Collection> {
    return this._connectToDatabase().catch(() => Promise.reject('Cannot connect to Mongo !!'));
  }

  /**
   * Connection status for the health check ('OK' or 'KO : <reason>'). When not connected, a new
   * connection attempt is started (without waiting for it).
   */
  getConnectionStatus(): string {
    if (this.collections.users) {
      return 'OK';
    }
    this._connectToDatabase().catch(() => undefined);
    return `KO : ${this._lastConnectionError ?? 'not connected yet'}`;
  }

  /**
   * get a user from Db
   * @returns {Promise<User[]>}
   * @private
   */
  public getAllUsers(): Promise<mongoDB.Document[]> {
    return this._getUsers().then((users) => users.find({}).sort({ updated: -1 }).toArray());
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
    return this._getUsers().then((users) => {
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

      return users.replaceOne(filter, user, { upsert: tryInsert });
    });
  }
  public deleteUser(userId: string): Promise<mongoDB.Document> {
    const filter: mongoDB.Filter<mongoDB.Document> = { id: userId };

    return this._getUsers().then((users) => users.deleteOne(filter));
  }

  /**
   * get a user from Db
   * @param {Object} query
   * @returns {Promise<User>}
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _findUserBy(query: any): Promise<mongoDB.Document> {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    return this._getUsers().then((users) => users.findOne(query as {}));
  }
}
