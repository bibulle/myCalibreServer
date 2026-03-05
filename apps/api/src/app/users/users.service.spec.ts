import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { MyCalibreDbService } from '../database/my-calibre-db.service';
import { MailService } from '../utils/mail.service';
import { User, UserAPI, BookData } from '@my-calibre-server/api-interfaces';

describe('UsersService', () => {
  let service: UsersService;
  let myCalibreDbService: MyCalibreDbService;
  let mailService: MailService;
  let configService: ConfigService;

  const mockMyCalibreDbService = {
    getAllUsers: jest.fn(),
    findUserByUsername: jest.fn(),
    findUserById: jest.fn(),
    findUserByGoogleId: jest.fn(),
    findUserByFacebookId: jest.fn(),
    findByTemporaryToken: jest.fn(),
    saveUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AUTHENT_JWT_SECRET: 'test-secret-key-for-jwt',
        AUTHENT_LENGTH: '64',
        AUTHENT_DIGEST: 'sha512',
      };
      return config[key];
    }),
  };

  const mockUser: User = {
    id: 'user123',
    created: new Date('2023-01-01'),
    updated: new Date('2023-01-01'),
    local: {
      username: 'testuser',
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      hashedPassword: 'hashedpass123',
      salt: 'salt123',
      isAdmin: false,
      amazonEmails: ['amazon@example.com'],
    },
    facebook: {
      id: 'fb123',
      token: 'fbtoken',
      email: 'fb@example.com',
      name: 'FB User',
    },
    twitter: {
      id: 'tw123',
      token: 'twtoken',
      displayName: 'TW User',
    },
    google: {
      id: 'google123',
      token: 'googletoken',
      email: 'google@example.com',
      name: 'Google User',
    },
    history: {
      lastConnection: new Date('2023-01-01'),
      downloadedBooks: [],
      ratings: [],
    },
    temporary_token: undefined,
    temporary_token_date: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MyCalibreDbService,
          useValue: mockMyCalibreDbService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    myCalibreDbService = module.get<MyCalibreDbService>(MyCalibreDbService);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockMyCalibreDbService.getAllUsers.mockResolvedValue(users);

      const result = await service.getAll();

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(mockMyCalibreDbService.getAllUsers).toHaveBeenCalled();
    });

    it('should return null if no users found', async () => {
      mockMyCalibreDbService.getAllUsers.mockResolvedValue(null);

      const result = await service.getAll();

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockMyCalibreDbService.getAllUsers.mockRejectedValue(new Error('DB Error'));

      await expect(service.getAll()).rejects.toThrow('DB Error');
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      mockMyCalibreDbService.findUserByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toBeDefined();
      expect(result.local.username).toBe('testuser');
      expect(mockMyCalibreDbService.findUserByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return null if user not found', async () => {
      mockMyCalibreDbService.findUserByUsername.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      mockMyCalibreDbService.findUserById.mockResolvedValue(mockUser);

      const result = await service.findById('user123');

      expect(result).toBeDefined();
      expect(result.id).toBe('user123');
      expect(mockMyCalibreDbService.findUserById).toHaveBeenCalledWith('user123');
    });

    it('should return null if user not found', async () => {
      mockMyCalibreDbService.findUserById.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should find user by Google ID', async () => {
      mockMyCalibreDbService.findUserByGoogleId.mockResolvedValue(mockUser);

      const result = await service.findByGoogleId('google123');

      expect(result).toBeDefined();
      expect(result.google.id).toBe('google123');
      expect(mockMyCalibreDbService.findUserByGoogleId).toHaveBeenCalledWith('google123');
    });
  });

  describe('findByFacebookId', () => {
    it('should find user by Facebook ID', async () => {
      mockMyCalibreDbService.findUserByFacebookId.mockResolvedValue(mockUser);

      const result = await service.findByFacebookId('fb123');

      expect(result).toBeDefined();
      expect(result.facebook.id).toBe('fb123');
      expect(mockMyCalibreDbService.findUserByFacebookId).toHaveBeenCalledWith('fb123');
    });
  });

  describe('saveUser', () => {
    it('should save a user', async () => {
      mockMyCalibreDbService.saveUser.mockResolvedValue(mockUser);

      const result = await service.saveUser(mockUser);

      expect(result).toBeDefined();
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalledWith(mockUser, true, true);
    });

    it('should save user without changing update date', async () => {
      mockMyCalibreDbService.saveUser.mockResolvedValue(mockUser);

      await service.saveUser(mockUser, false);

      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalledWith(mockUser, true, false);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockMyCalibreDbService.deleteUser.mockResolvedValue(true);

      await service.deleteUser('user123');

      expect(mockMyCalibreDbService.deleteUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('validPassword', () => {
    it('should validate correct password', () => {
      const user = { ...mockUser };
      // Generate hash for 'password123'
      user.local.hashedPassword = service['generateHash'](user, 'password123');

      const result = service.validPassword(user, 'password123');

      expect(result).toBe(true);
    });

    it('should reject incorrect password', () => {
      const user = { ...mockUser };
      user.local.hashedPassword = service['generateHash'](user, 'correctpassword');

      const result = service.validPassword(user, 'wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('createToken', () => {
    it('should create a JWT token', () => {
      const token = service.createToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should not include sensitive data in token', () => {
      const token = service.createToken(mockUser);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.history.downloadedBooks).toBeUndefined();
      expect(payload.history.ratings).toBeUndefined();
    });
  });

  describe('checkToken', () => {
    it('should validate and decode a valid token', async () => {
      const token = service.createToken(mockUser);
      mockMyCalibreDbService.findUserById.mockResolvedValue(mockUser);

      const result = await service.checkToken(token);

      expect(result).toBeDefined();
      expect(result.id).toBe('user123');
    });

    it('should reject invalid token', async () => {
      await expect(service.checkToken('invalid.token.here')).rejects.toThrow();
    });
  });

  describe('user2API', () => {
    it('should convert user to API format', () => {
      const apiUser = service.user2API(mockUser);

      expect(apiUser).toBeDefined();
      expect(apiUser.id).toBe('user123');
      expect(apiUser.local.username).toBe('testuser');
    });

    it('should remove sensitive tokens', () => {
      const apiUser = service.user2API(mockUser);

      expect(apiUser.facebook['token']).toBeUndefined();
      expect(apiUser.google['token']).toBeUndefined();
      expect(apiUser.twitter['token']).toBeUndefined();
    });

    it('should initialize empty history arrays', () => {
      const userWithoutHistory = { ...mockUser, history: {} as any };
      const apiUser = service.user2API(userWithoutHistory);

      expect(apiUser.history.downloadedBooks).toEqual([]);
      expect(apiUser.history.ratings).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should create a user from raw data', () => {
      const rawData = {
        id: 'newuser',
        local: {
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        },
      };

      const user = service.createUser(rawData);

      expect(user).toBeDefined();
      expect(user.id).toBe('newuser');
      expect(user.local.hashedPassword).toBeDefined();
      expect(user.local['password']).toBeUndefined();
    });

    it('should initialize missing provider fields', () => {
      const rawData = { id: 'test' };

      const user = service.createUser(rawData);

      expect(user.local).toBeDefined();
      expect(user.facebook).toBeDefined();
      expect(user.twitter).toBeDefined();
      expect(user.google).toBeDefined();
      expect(user.history).toBeDefined();
    });

    it('should generate salt if missing', () => {
      const rawData = {
        id: 'test',
        local: {},
      };

      const user = service.createUser(rawData);

      expect(user.local.salt).toBeDefined();
      expect(user.local.salt.length).toBeGreaterThan(0);
    });

    it('should hash password if provided', () => {
      const rawData = {
        id: 'test',
        local: {
          password: 'mypassword',
        },
      };

      const user = service.createUser(rawData);

      expect(user.local.hashedPassword).toBeDefined();
      expect(user.local['password']).toBeUndefined();
    });

    it('should convert string dates to Date objects', () => {
      const rawData = {
        id: 'test',
        created: '2023-01-01',
        history: {
          downloadedBooks: [{ id: 1, date: '2023-01-01' }],
          ratings: [{ book_id: 1, date: '2023-01-01', rating: 5 }],
        },
      };

      const user = service.createUser(rawData);

      expect(user.created).toBeInstanceOf(Date);
      expect(user.history.downloadedBooks[0].date).toBeInstanceOf(Date);
      expect(user.history.ratings[0].date).toBeInstanceOf(Date);
    });

    it('should handle amazonEmails as string', () => {
      const rawData = {
        id: 'test',
        local: {
          amazonEmails: 'email1@amazon.com|email2@amazon.com',
        },
      };

      const user = service.createUser(rawData);

      expect(Array.isArray(user.local.amazonEmails)).toBe(true);
      expect(user.local.amazonEmails.length).toBe(2);
    });

    it('should convert isAdmin to boolean', () => {
      const rawData = {
        id: 'test',
        local: {
          isAdmin: 1,
        },
      };

      const user = service.createUser(rawData);

      expect(typeof user.local.isAdmin).toBe('boolean');
      expect(user.local.isAdmin).toBe(true);
    });
  });

  describe('updateLastConnection', () => {
    it('should reload user from DB before updating last connection', async () => {
      const freshUser = { ...mockUser, history: { ...mockUser.history, lastConnection: new Date('2023-01-01') } };
      mockMyCalibreDbService.findUserById.mockResolvedValue(freshUser);
      mockMyCalibreDbService.saveUser.mockResolvedValue(freshUser);

      const staleUser = { ...mockUser };

      await service.updateLastConnection(staleUser);

      expect(mockMyCalibreDbService.findUserById).toHaveBeenCalledWith('user123');
      expect(freshUser.history.lastConnection.getTime()).toBeGreaterThan(new Date('2023-01-01').getTime());
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalledWith(freshUser, true, false);
    });
  });

  describe('addDownloadedBook', () => {
    it('should add a downloaded book to user history', async () => {
      const user = { ...mockUser, history: { ...mockUser.history, downloadedBooks: [] } };
      mockMyCalibreDbService.findUserById.mockResolvedValue(user);
      mockMyCalibreDbService.saveUser.mockResolvedValue(user);

      const bookData: BookData = {
        data_id: 1,
        data_format: 'EPUB',
        data_size: 1000,
        data_name: 'test-book',
      };

      await service.addDownloadedBook(user, 123, bookData);

      expect(mockMyCalibreDbService.findUserById).toHaveBeenCalledWith('user123');
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalled();
    });

    it('should not add duplicate book', async () => {
      const bookData: BookData = {
        data_id: 1,
        data_format: 'EPUB',
        data_size: 1000,
        data_name: 'test-book',
      };
      const user = {
        ...mockUser,
        history: {
          ...mockUser.history,
          downloadedBooks: [{ id: 123, data: bookData, date: new Date() }],
        },
      };
      mockMyCalibreDbService.findUserById.mockResolvedValue(user);
      mockMyCalibreDbService.saveUser.mockResolvedValue(user);

      await service.addDownloadedBook(user, 123, bookData);

      // Book should not be added again, but save should still be called
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalled();
    });
  });

  describe('addRatingBook', () => {
    it('should reload user from DB before modifying ratings', async () => {
      const freshUser = { ...mockUser, history: { ...mockUser.history, ratings: [], downloadedBooks: [{ id: 999, data: { data_id: 1, data_format: 'EPUB', data_size: 100, data_name: 'existing-book' }, date: new Date() }] } };
      mockMyCalibreDbService.findUserById.mockResolvedValue(freshUser);
      mockMyCalibreDbService.saveUser.mockResolvedValue(freshUser);

      const staleUser = { ...mockUser, history: { ...mockUser.history, ratings: [], downloadedBooks: [] } };

      await service.addRatingBook(staleUser, 123, 'Test Book', 5);

      expect(mockMyCalibreDbService.findUserById).toHaveBeenCalledWith('user123');
      expect(freshUser.history.ratings.length).toBe(1);
      expect(freshUser.history.ratings[0].book_id).toBe(123);
      expect(freshUser.history.ratings[0].rating).toBe(5);
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalled();
    });

    it('should update existing rating', async () => {
      const user = {
        ...mockUser,
        history: {
          ...mockUser.history,
          ratings: [{ book_id: 123, rating: 3, date: new Date('2023-01-01'), book_name: 'Test Book' }],
        },
      };
      mockMyCalibreDbService.findUserById.mockResolvedValue(user);
      mockMyCalibreDbService.saveUser.mockResolvedValue(user);

      await service.addRatingBook(user, 123, 'Test Book', 5);

      expect(user.history.ratings.length).toBe(1);
      expect(user.history.ratings[0].rating).toBe(5);
      expect(user.history.ratings[0].date.getTime()).toBeGreaterThan(new Date('2023-01-01').getTime());
    });

    it('should not update if rating is the same', async () => {
      const existingDate = new Date('2023-01-01');
      const user = {
        ...mockUser,
        history: {
          ...mockUser.history,
          ratings: [{ book_id: 123, rating: 5, date: existingDate, book_name: 'Test Book' }],
        },
      };
      mockMyCalibreDbService.findUserById.mockResolvedValue(user);
      mockMyCalibreDbService.saveUser.mockResolvedValue(user);

      await service.addRatingBook(user, 123, 'Test Book', 5);

      expect(user.history.ratings[0].date).toBe(existingDate);
    });
  });

  describe('changeUserPassword', () => {
    it('should change user password', async () => {
      mockMyCalibreDbService.findUserById.mockResolvedValue(mockUser);
      mockMyCalibreDbService.saveUser.mockResolvedValue(mockUser);

      const result = await service.changeUserPassword('user123', 'newpassword');

      expect(result).toBeDefined();
      expect(mockMyCalibreDbService.findUserById).toHaveBeenCalledWith('user123');
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalled();
    });

    it('should reject if user not found', async () => {
      mockMyCalibreDbService.findUserById.mockResolvedValue(null);

      await expect(service.changeUserPassword('nonexistent', 'newpassword')).rejects.toEqual('User not found');
    });
  });

  describe('resetUserPassword', () => {
    it('should send password reset email', async () => {
      mockMyCalibreDbService.findUserById.mockResolvedValue(mockUser);
      mockMyCalibreDbService.saveUser.mockResolvedValue(mockUser);
      mockMailService.sendMail.mockResolvedValue(true);

      await service.resetUserPassword('user123');

      expect(mockMyCalibreDbService.findUserById).toHaveBeenCalledWith('user123');
      expect(mockMailService.sendMail).toHaveBeenCalledWith('test@example.com', 'Reset your password on Bibulle shared library', expect.stringContaining('Please use this'));
    });

    it('should reject if user not found', async () => {
      mockMyCalibreDbService.findUserById.mockResolvedValue(null);

      await expect(service.resetUserPassword('nonexistent')).rejects.toEqual('User not found');
    });

    it('should reject if user has no email', async () => {
      const userWithoutEmail = {
        ...mockUser,
        local: { ...mockUser.local, email: undefined },
        google: { ...mockUser.google, email: undefined },
        facebook: { ...mockUser.facebook, email: undefined },
      };
      mockMyCalibreDbService.findUserById.mockResolvedValue(userWithoutEmail);

      await expect(service.resetUserPassword('user123')).rejects.toEqual('User has no email');
    });
  });

  describe('validTemporaryToken', () => {
    it('should validate correct temporary token', () => {
      const user = {
        ...mockUser,
        temporary_token: 'temp-token-123',
        temporary_token_date: new Date(),
      };

      const result = service.validTemporaryToken(user, 'temp-token-123');

      expect(result).toBe(true);
    });

    it('should reject expired token', () => {
      const user = {
        ...mockUser,
        temporary_token: 'temp-token-123',
        temporary_token_date: new Date(Date.now() - 1000 * 3600 * 11), // 11 hours ago
      };

      const result = service.validTemporaryToken(user, 'temp-token-123');

      expect(result).toBe(false);
    });

    it('should reject wrong token', () => {
      const user = {
        ...mockUser,
        temporary_token: 'temp-token-123',
        temporary_token_date: new Date(),
      };

      const result = service.validTemporaryToken(user, 'wrong-token');

      expect(result).toBe(false);
    });
  });

  describe('mergeAndSaveUsers', () => {
    it('should merge two users and delete source', async () => {
      const userSrc = { ...mockUser, id: 'src' };
      const userTrg = { ...mockUser, id: 'trg' };
      mockMyCalibreDbService.deleteUser.mockResolvedValue(true);
      mockMyCalibreDbService.saveUser.mockResolvedValue(userTrg);

      await service.mergeAndSaveUsers(userSrc, userTrg);

      expect(mockMyCalibreDbService.deleteUser).toHaveBeenCalledWith('src');
      expect(mockMyCalibreDbService.saveUser).toHaveBeenCalledWith(userTrg, true, true);
    });

    it('should keep older creation date', async () => {
      const olderDate = new Date('2020-01-01');
      const newerDate = new Date('2023-01-01');
      const userSrc = { ...mockUser, id: 'src', created: olderDate };
      const userTrg = { ...mockUser, id: 'trg', created: newerDate };
      mockMyCalibreDbService.deleteUser.mockResolvedValue(true);
      mockMyCalibreDbService.saveUser.mockResolvedValue(userTrg);

      await service.mergeAndSaveUsers(userSrc, userTrg);

      expect(userTrg.created).toBe(olderDate);
    });

    it('should merge downloaded books without duplicates', async () => {
      const bookData: BookData = { data_id: 1, data_format: 'EPUB', data_size: 1000, data_name: 'book' };
      const userSrc = {
        ...mockUser,
        id: 'src',
        history: {
          ...mockUser.history,
          downloadedBooks: [{ id: 1, data: bookData, date: new Date() }],
        },
      };
      const userTrg = {
        ...mockUser,
        id: 'trg',
        history: {
          ...mockUser.history,
          downloadedBooks: [{ id: 2, data: bookData, date: new Date() }],
        },
      };
      mockMyCalibreDbService.deleteUser.mockResolvedValue(true);
      mockMyCalibreDbService.saveUser.mockResolvedValue(userTrg);

      await service.mergeAndSaveUsers(userSrc, userTrg);

      expect(userTrg.history.downloadedBooks.length).toBe(2);
    });
  });
});
