'use strict';

/**
 * Minimal stand-in for the `mongodb` driver, used only to run the API against
 * for the read-only Playwright e2e suite in environments without a MongoDB
 * instance (see ../README.md). Implements just the surface actually used by
 * MyCalibreDbService: MongoClient#connect/db, Db#collection, and the
 * find().sort().toArray()/findOne/replaceOne/deleteOne collection methods.
 *
 * Not wired into the real app or its build by default - it's only loaded via
 * a `--require` hook (see ./register.js) when explicitly requested.
 */

class FakeCollection {
  constructor(name) {
    this.collectionName = name;
    this._docs = [];
  }

  find() {
    const docs = this._docs;
    return {
      sort() {
        return {
          toArray(callback) {
            callback(null, docs.slice());
          },
        };
      },
    };
  }

  findOne() {
    return Promise.resolve(null);
  }

  replaceOne(filter, doc, options) {
    return Promise.resolve({
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: options && options.upsert ? 1 : 0,
      upsertedId: null,
    });
  }

  deleteOne() {
    return Promise.resolve({ acknowledged: true, deletedCount: 0 });
  }
}

class FakeDb {
  constructor(name) {
    this.databaseName = name;
    this._collections = new Map();
  }

  collection(name) {
    if (!this._collections.has(name)) {
      this._collections.set(name, new FakeCollection(name));
    }
    return this._collections.get(name);
  }
}

class MongoClient {
  constructor(url) {
    this._url = url;
    this._dbs = new Map();
  }

  connect() {
    return Promise.resolve(this);
  }

  db(name) {
    if (!this._dbs.has(name)) {
      this._dbs.set(name, new FakeDb(name));
    }
    return this._dbs.get(name);
  }

  close() {
    return Promise.resolve();
  }
}

module.exports = { MongoClient };
