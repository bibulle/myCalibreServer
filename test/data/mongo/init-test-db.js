/**
 * MongoDB Test Database Initialization Script
 * 
 * This script creates a test MongoDB database for integration testing.
 * Run with: node test/data/mongo/init-test-db.js
 * 
 * Or use docker-compose for a test MongoDB instance:
 * docker run -d -p 27017:27017 --name mongo-test mongo:latest
 */

const { MongoClient } = require('mongodb');

// Test database configuration
const MONGO_URL = process.env.MONGO_TEST_URL || 'mongodb://localhost:27017';
const DB_NAME = 'myCalibreDb_test';
const USERS_COLLECTION = 'users';

// Test data
const testUsers = [
  {
    id: 'test-user-1',
    local: {
      username: 'testuser',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', // bcrypt hash for 'password123'
    },
    email: 'test@example.com',
    roles: ['user'],
    created: new Date('2024-01-01T00:00:00.000Z'),
    updated: new Date('2024-01-15T10:30:00.000Z'),
    history: {
      downloadedBooks: [
        {
          book_id: 1,
          book_title: 'Test Book 1',
          date: new Date('2024-01-10T15:20:00.000Z'),
        },
        {
          book_id: 2,
          book_title: 'Test Book 2',
          date: new Date('2024-01-12T09:15:00.000Z'),
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
    id: 'test-user-2',
    google: {
      id: 'google-123456',
      email: 'googleuser@gmail.com',
      name: 'Google Test User',
    },
    email: 'googleuser@gmail.com',
    roles: ['user'],
    created: new Date('2024-02-01T00:00:00.000Z'),
    updated: new Date('2024-02-05T14:20:00.000Z'),
    history: {
      downloadedBooks: [
        {
          book_id: 2,
          book_title: 'Test Book 2',
          date: new Date('2024-02-03T11:30:00.000Z'),
        },
      ],
      ratings: [],
    },
  },
  {
    id: 'test-user-3',
    facebook: {
      id: 'facebook-789012',
      email: 'fbuser@facebook.com',
      name: 'Facebook Test User',
    },
    email: 'fbuser@facebook.com',
    roles: ['user', 'admin'],
    created: new Date('2024-03-01T00:00:00.000Z'),
    updated: new Date('2024-03-10T16:45:00.000Z'),
    history: {
      downloadedBooks: [],
      ratings: [
        {
          book_id: 1,
          rating: 4,
          date: new Date('2024-03-05T10:00:00.000Z'),
        },
        {
          book_id: 2,
          rating: 3,
          date: new Date('2024-03-08T14:30:00.000Z'),
        },
      ],
    },
  },
  {
    id: 'test-user-4',
    local: {
      username: 'adminuser',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
    },
    email: 'admin@example.com',
    roles: ['user', 'admin'],
    temporary_token: 'temp-token-123456',
    created: new Date('2023-12-01T00:00:00.000Z'),
    updated: new Date('2024-01-20T08:00:00.000Z'),
    history: {
      downloadedBooks: [
        {
          book_id: 1,
          book_title: 'Test Book 1',
          date: new Date('2024-01-05T13:00:00.000Z'),
        },
      ],
      ratings: [],
    },
  },
];

async function initTestDatabase() {
  let client;
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URL}...`);
    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✓ Connected to MongoDB');

    // Get or create database
    const db = client.db(DB_NAME);
    console.log(`✓ Using database: ${DB_NAME}`);

    // Drop collection if exists (clean slate)
    const collections = await db.listCollections({ name: USERS_COLLECTION }).toArray();
    if (collections.length > 0) {
      await db.collection(USERS_COLLECTION).drop();
      console.log(`✓ Dropped existing collection: ${USERS_COLLECTION}`);
    }

    // Create collection
    const usersCollection = db.collection(USERS_COLLECTION);
    console.log(`✓ Created collection: ${USERS_COLLECTION}`);

    // Insert test data
    const result = await usersCollection.insertMany(testUsers);
    console.log(`✓ Inserted ${result.insertedCount} test users`);

    // Create indexes
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    await usersCollection.createIndex({ 'local.username': 1 });
    await usersCollection.createIndex({ 'google.id': 1 });
    await usersCollection.createIndex({ 'facebook.id': 1 });
    await usersCollection.createIndex({ temporary_token: 1 });
    await usersCollection.createIndex({ updated: -1 });
    console.log('✓ Created indexes');

    // Verify data
    const count = await usersCollection.countDocuments();
    console.log(`\n✅ Test database initialized successfully!`);
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Collection: ${USERS_COLLECTION}`);
    console.log(`   Users: ${count}`);
    console.log(`\nTest users:`);
    testUsers.forEach(user => {
      console.log(`   - ${user.id} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Error initializing test database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✓ Closed MongoDB connection');
    }
  }
}

// Run if called directly
if (require.main === module) {
  initTestDatabase();
}

module.exports = { initTestDatabase, MONGO_URL, DB_NAME, USERS_COLLECTION, testUsers };
