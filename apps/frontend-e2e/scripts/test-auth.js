#!/usr/bin/env node
/**
 * Test authentication manually
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const MONGO_URL = 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'myCalibreDb_test';

function generateHash(password, salt) {
  const length = 512;
  const digest = 'sha512';
  return crypto.pbkdf2Sync(password, salt, 10000, length, digest).toString('hex');
}

async function testAuth() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db(MONGO_DB_NAME);
    const users = await db.collection('users').find({}).toArray();

    console.log(`\nFound ${users.length} users:`);
    users.forEach((user) => {
      console.log(`\n  User: ${user.local.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Has salt: ${!!user.local.salt}`);
      console.log(`  Has hashedPassword: ${!!user.local.hashedPassword}`);
      console.log(`  Has password field: ${!!user.local.password}`);

      if (user.local.salt && user.local.password) {
        const computedHash = generateHash('password123', user.local.salt);
        console.log(`  Password field exists - needs to be converted to hashedPassword`);
      }

      if (user.local.salt && user.local.hashedPassword) {
        const testHash = generateHash('password123', user.local.salt);
        const matches = testHash === user.local.hashedPassword;
        console.log(`  Test password match: ${matches ? '✓ YES' : '✗ NO'}`);
      }
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

testAuth();
