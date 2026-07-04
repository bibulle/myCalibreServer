import { Test, TestingModule } from '@nestjs/testing';
import { MyCalibreDbService } from './my-calibre-db.service';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';

// Test database configuration
const MONGO_TEST_URL = process.env.MONGO_TEST_URL || 'mongodb://localhost:27017';
const MONGO_TEST_DB_NAME = 'myCalibreDb_test';
const MONGO_TEST_USERS_COL = 'users';

/**
 * MyCalibreDbService Integration Tests
 * 
 * These tests require a running MongoDB instance.
 * 
 * To run these tests:
 * 1. Start MongoDB: docker run -d -p 27017:27017 --name mongo-test mongo:latest
 * 2. Initialize test data: node test/data/mongo/init-test-db.js
 * 3. Run tests: npx nx test api --testPathPattern=my-calibre-db.service.spec
 * 
 * The tests will be skipped if MongoDB is not available.
 */
describe('MyCalibreDbService', () => {
  let service: MyCalibreDbService;
  let configService: ConfigService;
  let mongoClient: MongoClient;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'MONGO_URL') {
        return MONGO_TEST_URL;
      }
      if (key === 'MONGO_DB_NAME') {
        return MONGO_TEST_DB_NAME;
      }
      if (key === 'MONGO_USERS_COL_NAME') {
        return MONGO_TEST_USERS_COL;
      }
      return undefined;
    }),
  };

  beforeAll(async () => {
    // Try to connect to MongoDB
    try {
      mongoClient = new MongoClient(MONGO_TEST_URL, {
        serverSelectionTimeoutMS: 2000,
      });
      await mongoClient.connect();
    } catch (error) {
      console.warn(
        '\n⚠️  MongoDB not available at ' + MONGO_TEST_URL + '\n' +
        '   Skipping MyCalibreDbService integration tests.\n' +
        '   To run these tests:\n' +
        '   1. Start MongoDB: docker run -d -p 27017:27017 --name mongo-test mongo:latest\n' +
        '   2. Initialize: node test/data/mongo/init-test-db.js\n' +
        '   3. Run tests again\n'
      );
      mongoClient = null;
      return;
    }
    
    const db = mongoClient.db(MONGO_TEST_DB_NAME);
    const collection = db.collection(MONGO_TEST_USERS_COL);

    // Clean and insert test data
    await collection.deleteMany({});
    await collection.insertMany([
      {
        id: 'test-user-1',
        local: {
          username: 'testuser',
          password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
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
          downloadedBooks: [],
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
          ratings: [],
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
          downloadedBooks: [],
          ratings: [],
        },
      },
    ]);
  });

  beforeEach(async () => {
    if (!mongoClient) {
      // Skip if MongoDB is not available
      return;
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyCalibreDbService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MyCalibreDbService>(MyCalibreDbService);
    configService = module.get<ConfigService>(ConfigService);

    // Wait for MongoDB connection to be ready
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    if (!mongoClient) return;
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users from test database', async () => {
      if (!mongoClient) return;
      
      const result = await service.getAllUsers();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });

    it('should return users sorted by updated date descending', async () => {
      if (!mongoClient) return;

      const result = await service.getAllUsers();

      expect(result[0].updated.getTime()).toBeGreaterThanOrEqual(result[1].updated.getTime());
    });

    it('should return users with expected properties', async () => {
      if (!mongoClient) return;

      const result = await service.getAllUsers();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('roles');
      expect(result[0]).toHaveProperty('created');
      expect(result[0]).toHaveProperty('updated');
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      if (!mongoClient) return;

      const result = await service.findUserById('test-user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-user-1');
      expect(result.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      if (!mongoClient) return;

      const result = await service.findUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findUserByUsername', () => {
    it('should find user by local username', async () => {
      if (!mongoClient) return;

      const result = await service.findUserByUsername('testuser');

      expect(result).toBeDefined();
      expect(result.local.username).toBe('testuser');
      expect(result.id).toBe('test-user-1');
    });

    it('should return null for non-existent username', async () => {
      if (!mongoClient) return;

      const result = await service.findUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUserByGoogleId', () => {
    it('should find user by Google ID', async () => {
      if (!mongoClient) return;

      const result = await service.findUserByGoogleId('google-123456');

      expect(result).toBeDefined();
      expect(result.google.id).toBe('google-123456');
      expect(result.id).toBe('test-user-2');
    });

    it('should return null for non-existent Google ID', async () => {
      if (!mongoClient) return;

      const result = await service.findUserByGoogleId('non-existent-google-id');

      expect(result).toBeNull();
    });
  });

  describe('findUserByFacebookId', () => {
    it('should find user by Facebook ID', async () => {
      if (!mongoClient) return;

      const result = await service.findUserByFacebookId('facebook-789012');

      expect(result).toBeDefined();
      expect(result.facebook.id).toBe('facebook-789012');
      expect(result.id).toBe('test-user-3');
    });

    it('should return null for non-existent Facebook ID', async () => {
      if (!mongoClient) return;

      const result = await service.findUserByFacebookId('non-existent-fb-id');

      expect(result).toBeNull();
    });
  });

  describe('findByTemporaryToken', () => {
    it('should find user by temporary token', async () => {
      if (!mongoClient) return;

      const result = await service.findByTemporaryToken('temp-token-123456');

      expect(result).toBeDefined();
      expect(result.temporary_token).toBe('temp-token-123456');
      expect(result.id).toBe('test-user-4');
    });

    it('should return null for non-existent token', async () => {
      if (!mongoClient) return;

      const result = await service.findByTemporaryToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('saveUser', () => {
    it('should insert a new user', async () => {
      if (!mongoClient) return;

      const newUser = {
        id: 'test-user-new',
        email: 'newuser@example.com',
        roles: ['user'],
        local: {
          username: 'newuser',
          password: 'hashedpassword',
        },
      };

      const result = await service.saveUser(newUser as any, true);

      expect(result).toBeDefined();
      expect(result.upsertedCount).toBe(1);

      // Verify user was inserted
      const foundUser = await service.findUserById('test-user-new');
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('newuser@example.com');
    });

    it('should update an existing user', async () => {
      if (!mongoClient) return;

      const existingUser = await service.findUserById('test-user-1');
      existingUser.email = 'updated@example.com';

      const result = await service.saveUser(existingUser as any, false);

      expect(result).toBeDefined();

      // Verify user was updated
      const foundUser = await service.findUserById('test-user-1');
      expect(foundUser.email).toBe('updated@example.com');
    });

    it('should set created date if not present', async () => {
      if (!mongoClient) return;

      const newUser = {
        id: 'test-user-with-dates',
        email: 'datetest@example.com',
        roles: ['user'],
      };

      await service.saveUser(newUser as any, true);

      const foundUser = await service.findUserById('test-user-with-dates');
      expect(foundUser.created).toBeDefined();
      expect(foundUser.created).toBeInstanceOf(Date);
    });

    it('should update the updated date by default', async () => {
      if (!mongoClient) return;

      const existingUser = await service.findUserById('test-user-2');
      const oldUpdatedDate = existingUser.updated;

      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

      await service.saveUser(existingUser as any, false);

      const foundUser = await service.findUserById('test-user-2');
      expect(foundUser.updated.getTime()).toBeGreaterThan(oldUpdatedDate.getTime());
    });

    it('should not update the updated date when changeUpdateDate is false', async () => {
      if (!mongoClient) return;

      const existingUser = await service.findUserById('test-user-3');
      const oldUpdatedDate = existingUser.updated;

      await service.saveUser(existingUser as any, false, false);

      const foundUser = await service.findUserById('test-user-3');
      expect(foundUser.updated.getTime()).toBe(oldUpdatedDate.getTime());
    });

    it('should convert string dates in history to Date objects', async () => {
      if (!mongoClient) return;

      const userWithStringDates = {
        id: 'test-user-string-dates',
        email: 'stringdates@example.com',
        roles: ['user'],
        history: {
          downloadedBooks: [
            {
              book_id: 1,
              book_title: 'Test Book',
              date: '2024-01-01T00:00:00.000Z' as any,
            },
          ],
          ratings: [
            {
              book_id: 1,
              rating: 5,
              date: '2024-01-02T00:00:00.000Z' as any,
            },
          ],
        },
      };

      await service.saveUser(userWithStringDates as any, true);

      const foundUser = await service.findUserById('test-user-string-dates');
      expect(foundUser.history.downloadedBooks[0].date).toBeInstanceOf(Date);
      expect(foundUser.history.ratings[0].date).toBeInstanceOf(Date);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user by id', async () => {
      if (!mongoClient) return;

      // First verify user exists
      let user = await service.findUserById('test-user-4');
      expect(user).toBeDefined();

      // Delete user
      const result = await service.deleteUser('test-user-4');

      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(1);

      // Verify user was deleted
      user = await service.findUserById('test-user-4');
      expect(user).toBeNull();
    });

    it('should return deletedCount 0 for non-existent user', async () => {
      if (!mongoClient) return;

      const result = await service.deleteUser('non-existent-user');

      expect(result).toBeDefined();
      expect(result.deletedCount).toBe(0);
    });
  });
});
