'use strict';

/**
 * Test users seeded into the mongo-stub's `users` collection. Mirrors the
 * shape the real MyCalibreDbService/UsersService expect (local.salt,
 * local.hashedPassword, local.isAdmin, history.downloadedBooks/ratings).
 *
 * Password hashes are computed with pbkdf2Sync using AUTHENT_LENGTH/
 * AUTHENT_DIGEST from the environment so they always match whatever the API
 * process was started with (see playwright.config.ts's webServer env), even
 * if those values change.
 */

const crypto = require('crypto');

const AUTHENT_LENGTH = +(process.env.AUTHENT_LENGTH || 64);
const AUTHENT_DIGEST = process.env.AUTHENT_DIGEST || 'sha256';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, AUTHENT_LENGTH, AUTHENT_DIGEST).toString('hex');
}

const TEST_PASSWORD = 'password123';
const testUserSalt = 'e2e-test-salt-user';
const adminUserSalt = 'e2e-test-salt-admin';

const testUsers = [
  {
    id: 'e2e-user-1',
    local: {
      username: 'testuser',
      salt: testUserSalt,
      hashedPassword: hashPassword(TEST_PASSWORD, testUserSalt),
      isAdmin: false,
    },
    email: 'test@example.com',
    roles: ['user'],
    created: new Date('2024-01-01T00:00:00.000Z'),
    updated: new Date('2024-01-15T10:30:00.000Z'),
    history: {
      downloadedBooks: [
        {
          id: 1,
          data: { data_id: 1, data_format: 'EPUB', data_size: 1234, data_name: 'Test Book 1' },
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
      hashedPassword: hashPassword(TEST_PASSWORD, adminUserSalt),
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

module.exports = { testUsers, TEST_PASSWORD };
