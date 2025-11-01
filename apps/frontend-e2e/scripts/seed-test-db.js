#!/usr/bin/env node
/**
 * E2E Test Database Seeding Script
 *
 * This script initializes both MongoDB (user data) and Calibre SQLite (book data)
 * test databases for Cypress E2E testing.
 *
 * Run with: node apps/frontend-e2e/scripts/seed-test-db.js
 */

const { MongoClient } = require('mongodb');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const MONGO_URL = process.env.MONGO_TEST_URL || 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'myCalibreDb_test';
const USERS_COLLECTION = 'users';
const CALIBRE_TEST_DB = path.resolve(__dirname, '../../../test/data/calibre/metadata.db');

/**
 * Generate pbkdf2 hash matching backend's generateHash function
 * Backend uses: pbkdf2Sync(password, salt, 10000, AUTHENT_LENGTH, AUTHENT_DIGEST)
 * From .env: AUTHENT_LENGTH=128, AUTHENT_DIGEST='sha512'
 */
function generateHash(password, salt) {
  const length = 128; // Must match backend AUTHENT_LENGTH config (.env file)
  const digest = 'sha512'; // Must match backend AUTHENT_DIGEST config
  return crypto.pbkdf2Sync(password, salt, 10000, length, digest).toString('hex');
}

// Test MongoDB data
// Backend uses pbkdf2 hashing with salt, matching the authentication strategy
const testUserSalt = crypto.randomBytes(128).toString('base64');
const adminUserSalt = crypto.randomBytes(128).toString('base64');

const testUsers = [
  {
    id: 'e2e-user-1',
    local: {
      username: 'testuser',
      salt: testUserSalt,
      hashedPassword: generateHash('password123', testUserSalt),
      isAdmin: false,
    },
    email: 'test@example.com',
    roles: ['user'],
    created: new Date('2024-01-01T00:00:00.000Z'),
    updated: new Date('2024-01-15T10:30:00.000Z'),
    history: {
      downloadedBooks: [
        {
          book_id: 1,
          book_title: 'Dette de sang',
          date: new Date('2024-01-10T15:20:00.000Z'),
        },
      ],
      ratings: [
        {
          book_id: 1,
          rating: 5,
          date: new Date('2024-01-11T12:00:00.000Z'),
        },
      ],
    },
  },
  {
    id: 'e2e-user-2',
    local: {
      username: 'adminuser',
      salt: adminUserSalt,
      hashedPassword: generateHash('password123', adminUserSalt),
      isAdmin: true,
    },
    email: 'admin@example.com',
    roles: ['user', 'admin'],
    created: new Date('2023-12-01T00:00:00.000Z'),
    updated: new Date('2024-01-20T08:00:00.000Z'),
    history: {
      downloadedBooks: [],
      ratings: [
        {
          book_id: 2,
          rating: 4,
          date: new Date('2024-01-05T10:00:00.000Z'),
        },
      ],
    },
  },
];

/**
 * Initialize MongoDB test database
 */
async function seedMongoDb() {
  let client;

  try {
    console.log('\n📦 Seeding MongoDB test database...');
    console.log(`   URL: ${MONGO_URL}`);

    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('   ✓ Connected to MongoDB');

    const db = client.db(MONGO_DB_NAME);
    console.log(`   ✓ Using database: ${MONGO_DB_NAME}`);

    // Drop collection if exists
    const collections = await db.listCollections({ name: USERS_COLLECTION }).toArray();
    if (collections.length > 0) {
      await db.collection(USERS_COLLECTION).drop();
      console.log(`   ✓ Dropped existing collection`);
    }

    // Create collection and insert data
    const usersCollection = db.collection(USERS_COLLECTION);
    const result = await usersCollection.insertMany(testUsers);
    console.log(`   ✓ Inserted ${result.insertedCount} test users`);

    // Create indexes
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    await usersCollection.createIndex({ 'local.username': 1 });
    await usersCollection.createIndex({ updated: -1 });
    console.log('   ✓ Created indexes');

    console.log('   ✅ MongoDB seeding complete!\n');
  } catch (error) {
    console.error('   ❌ MongoDB seeding failed:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Check Calibre SQLite test database
 */
async function checkCalibreDb() {
  return new Promise((resolve, reject) => {
    console.log('\n📚 Checking Calibre test database...');
    console.log(`   Path: ${CALIBRE_TEST_DB}`);

    if (!fs.existsSync(CALIBRE_TEST_DB)) {
      console.error('   ❌ Calibre test database not found!');
      console.log('   ℹ️  Expected location: test/data/calibre/metadata.db');
      reject(new Error('Calibre test database not found'));
      return;
    }

    const db = new sqlite3.Database(CALIBRE_TEST_DB, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('   ❌ Failed to open Calibre database:', err.message);
        reject(err);
        return;
      }

      console.log('   ✓ Database file exists and is readable');

      // Check for essential tables
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('books', 'authors', 'series', 'tags')", (err, rows) => {
        if (err) {
          console.error('   ❌ Failed to query tables:', err.message);
          db.close();
          reject(err);
          return;
        }

        const tableNames = rows.map((r) => r.name);
        console.log(`   ✓ Found tables: ${tableNames.join(', ')}`);

        // Count books
        db.get('SELECT COUNT(*) as count FROM books', (err, row) => {
          db.close();

          if (err) {
            console.error('   ❌ Failed to count books:', err.message);
            reject(err);
            return;
          }

          console.log(`   ✓ Books in database: ${row.count}`);
          console.log('   ✅ Calibre database ready!\n');
          resolve();
        });
      });
    });
  });
}

/**
 * Main seeding function
 */
async function seedAll() {
  console.log('🌱 Starting E2E test database seeding...');
  console.log('═'.repeat(50));

  try {
    await seedMongoDb();
    await checkCalibreDb();

    console.log('═'.repeat(50));
    console.log('✅ All test databases ready for E2E testing!\n');
    console.log('Test users:');
    testUsers.forEach((user) => {
      const roles = user.roles.join(', ');
      console.log(`  • ${user.local.username} (${user.email}) - Roles: ${roles}`);
    });
    console.log('\nPassword for all users: password123\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAll();
}

module.exports = { seedAll, seedMongoDb, checkCalibreDb };
