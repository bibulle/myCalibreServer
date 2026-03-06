import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { UsersService } from '../users/users.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '@my-calibre-server/api-interfaces';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-123',
    local: {
      username: 'testuser',
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      isAdmin: false,
    },
    facebook: {},
    twitter: {},
    google: { id: 'google-123', email: 'test@gmail.com' },
    history: {
      lastConnection: new Date(),
      downloadedBooks: [],
      ratings: [],
    },
  } as User;

  const mockAdminUser = {
    id: 'admin-123',
    local: {
      username: 'admin',
      firstname: 'Admin',
      lastname: 'User',
      email: 'admin@example.com',
      isAdmin: true,
    },
    facebook: {},
    twitter: {},
    google: {},
    history: {
      lastConnection: new Date(),
      downloadedBooks: [],
      ratings: [],
    },
  } as User;

  const mockUsersService = {
    getBearerUser: jest.fn(),
    saveUser: jest.fn(),
    updateLastConnection: jest.fn(),
    createToken: jest.fn(),
    findById: jest.fn(),
    user2API: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleLogin', () => {
    it('should initiate Google OAuth login flow', () => {
      const req = { user: mockUser };
      expect(() => controller.googleLogin(req)).not.toThrow();
    });
  });

  describe('googleLoginCallback', () => {
    it('should handle Google OAuth callback for new user', async () => {
      const req = { user: mockUser };
      const token = 'jwt-token-123';

      mockUsersService.getBearerUser.mockRejectedValue('No bearer');
      mockUsersService.updateLastConnection.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.googleLoginCallback(req);

      expect(usersService.updateLastConnection).toHaveBeenCalledWith(mockUser);
      expect(usersService.createToken).toHaveBeenCalledWith(mockUser);
      expect(result.id_token).toBe(token);
    });

    it('should handle Google OAuth callback for already connected user', async () => {
      const req = { user: mockUser };
      const connectedUser = { ...mockAdminUser, google: {} };
      const token = 'jwt-token-456';

      mockUsersService.getBearerUser.mockResolvedValue(connectedUser);
      mockUsersService.saveUser.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.googleLoginCallback(req);

      expect(connectedUser.google).toEqual(mockUser.google);
      expect(usersService.saveUser).toHaveBeenCalledWith(connectedUser);
      expect(result.id_token).toBe(token);
      expect(result.user).toBe(connectedUser);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.googleLoginCallback(req)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('googleIdTokenLogin', () => {
    it('should handle Google ID token login', async () => {
      const req = { user: mockUser };
      const token = 'jwt-token-789';

      mockUsersService.updateLastConnection.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.googleIdTokenLogin(req);

      expect(usersService.updateLastConnection).toHaveBeenCalledWith(mockUser);
      expect(result.id_token).toBe(token);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.googleIdTokenLogin(req)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('googleUnlink', () => {
    it('should allow user to unlink their own Google account', async () => {
      const req = { user: { ...mockUser } };
      const token = 'jwt-token-unlink';

      mockUsersService.saveUser.mockReturnValue(undefined);
      mockUsersService.user2API.mockReturnValue({ id: mockUser.id });
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.googleUnlink(req, mockUser.id);

      expect(req.user.google).toEqual({});
      expect(usersService.saveUser).toHaveBeenCalled();
      expect(result.id_token).toBe(token);
    });

    it('should allow admin to unlink another user Google account', async () => {
      const req = { user: mockAdminUser };
      const targetUser = { ...mockUser };

      mockUsersService.findById.mockResolvedValue(targetUser);
      mockUsersService.saveUser.mockReturnValue(undefined);
      mockUsersService.user2API.mockReturnValue({ id: targetUser.id });

      const result = await controller.googleUnlink(req, mockUser.id);

      expect(targetUser.google).toEqual({});
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should reject non-admin unlinking another user', async () => {
      const req = { user: mockUser };

      await expect(controller.googleUnlink(req, 'other-user-id')).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw BadRequest when userId is missing', async () => {
      const req = { user: mockUser };

      await expect(controller.googleUnlink(req, '')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('facebookLogin', () => {
    it('should initiate Facebook OAuth login flow', () => {
      const req = { user: mockUser };
      expect(() => controller.facebookLogin(req)).not.toThrow();
    });
  });

  describe('facebookjLoginCallback', () => {
    it('should handle Facebook OAuth callback for new user', async () => {
      const userWithFacebook = {
        ...mockUser,
        facebook: { id: 'fb-123', email: 'test@fb.com' },
      };
      const req = { user: userWithFacebook };
      const token = 'jwt-token-fb';

      mockUsersService.getBearerUser.mockRejectedValue('No bearer');
      mockUsersService.updateLastConnection.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.facebookjLoginCallback(req);

      expect(usersService.updateLastConnection).toHaveBeenCalledWith(userWithFacebook);
      expect(result.id_token).toBe(token);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.facebookjLoginCallback(req)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('facebookUnlink', () => {
    it('should allow user to unlink their own Facebook account', async () => {
      const req = { user: { ...mockUser, facebook: { id: 'fb-123' } } };
      const token = 'jwt-token-fb-unlink';

      mockUsersService.saveUser.mockReturnValue(undefined);
      mockUsersService.user2API.mockReturnValue({ id: mockUser.id });
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.facebookUnlink(req, mockUser.id);

      expect(req.user.facebook).toEqual({});
      expect(result.id_token).toBe(token);
    });

    it('should throw BadRequest when userId is missing', async () => {
      const req = { user: mockUser };

      await expect(controller.facebookUnlink(req, '')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('login', () => {
    it('should handle local login', async () => {
      const req = { user: mockUser };
      const token = 'jwt-token-local';

      mockUsersService.updateLastConnection.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.login(req);

      expect(usersService.updateLastConnection).toHaveBeenCalledWith(mockUser);
      expect(result.id_token).toBe(token);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.login(req)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('getUser', () => {
    it('should return user information', async () => {
      const req = { user: mockUser };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.user2API.mockReturnValue({ id: mockUser.id });

      const result = await controller.getUser(req);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.getUser(req)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('signup', () => {
    it('should handle local signup', async () => {
      const req = { user: mockUser };
      const token = 'jwt-token-signup';

      mockUsersService.updateLastConnection.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.signup(req);

      expect(usersService.updateLastConnection).toHaveBeenCalledWith(mockUser);
      expect(result.id_token).toBe(token);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.signup(req)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('checkToken', () => {
    it('should validate temporary token', async () => {
      const req = { user: mockUser };
      const token = 'jwt-token-temp';

      mockUsersService.updateLastConnection.mockReturnValue(undefined);
      mockUsersService.createToken.mockReturnValue(token);

      const result = await controller.checkToken(req);

      expect(usersService.updateLastConnection).toHaveBeenCalledWith(mockUser);
      expect(result.id_token).toBe(token);
    });

    it('should throw when user is undefined', async () => {
      const req = { user: undefined };

      await expect(controller.checkToken(req)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
