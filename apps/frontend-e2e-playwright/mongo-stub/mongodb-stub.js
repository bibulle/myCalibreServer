'use strict';

/**
 * Minimal in-memory stand-in for the `mongodb` driver, used to run the API
 * for the Playwright e2e suite without a real MongoDB instance anywhere
 * (see ../README.md). Implements just the surface actually used by
 * MyCalibreDbService: MongoClient#connect/db, Db#collection, and the
 * find().sort().toArray()/findOne/replaceOne/deleteOne collection methods -
 * but backed by a real (if tiny) query engine instead of no-ops, and
 * pre-seeded with test users, so authenticated flows (login, ratings,
 * download history) work the same as they would against a real MongoDB.
 *
 * Not wired into the real app or its build by default - it's only loaded via
 * a `--require` hook (see ./register.js) when explicitly requested.
 */

const { testUsers } = require('./fixtures');

function clone(doc) {
  return doc === null || doc === undefined ? doc : JSON.parse(JSON.stringify(doc));
}

function getPath(obj, path) {
  return path.split('.').reduce((o, key) => (o === null || o === undefined ? undefined : o[key]), obj);
}

// Supports the narrow filter shapes MyCalibreDbService actually issues:
// {}, { id }, { 'google.id' }, { 'facebook.id' }, { temporary_token },
// { $or: [...] }.
function matches(doc, filter) {
  return Object.entries(filter || {}).every(([key, value]) => {
    if (key === '$or') {
      return value.some((subFilter) => matches(doc, subFilter));
    }
    return getPath(doc, key) === value;
  });
}

class FakeCollection {
  constructor(name) {
    this.collectionName = name;
    this._docs = name === 'users' ? testUsers.map(clone) : [];
  }

  find(filter = {}) {
    const docs = this._docs.filter((doc) => matches(doc, filter)).map(clone);
    return {
      sort(spec) {
        const [[field, direction]] = Object.entries(spec);
        docs.sort((a, b) => {
          const av = getPath(a, field);
          const bv = getPath(b, field);
          const at = av instanceof Date ? av.getTime() : av;
          const bt = bv instanceof Date ? bv.getTime() : bv;
          if (at === bt) return 0;
          const cmp = at > bt ? 1 : -1;
          return direction === -1 ? -cmp : cmp;
        });
        return {
          toArray(callback) {
            callback(null, docs);
          },
        };
      },
    };
  }

  findOne(filter = {}) {
    const doc = this._docs.find((d) => matches(d, filter));
    return Promise.resolve(clone(doc) || null);
  }

  replaceOne(filter, doc, options = {}) {
    const idx = this._docs.findIndex((d) => matches(d, filter));
    if (idx >= 0) {
      this._docs[idx] = clone(doc);
      return Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0, upsertedId: null });
    }
    if (options.upsert) {
      this._docs.push(clone(doc));
      return Promise.resolve({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: doc.id ?? null });
    }
    return Promise.resolve({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null });
  }

  deleteOne(filter) {
    const idx = this._docs.findIndex((d) => matches(d, filter));
    if (idx >= 0) {
      this._docs.splice(idx, 1);
      return Promise.resolve({ acknowledged: true, deletedCount: 1 });
    }
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
