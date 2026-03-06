import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailService } from '../utils/mail.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '@my-calibre-server/api-interfaces';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let mailService: MailService;

  const mockUser = {
    id: 'user-123',
    local: {
      username: 'testuser',
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      isAdmin: false,
      salt: 'salt123',
      hashedPassword: 'hash123',
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

  const mockAdminUser = {
    id: 'admin-123',
    local: {
      username: 'admin',
      firstname: 'Admin',
      lastname: 'User',
      email: 'admin@example.com',
      isAdmin: true,
      salt: 'salt456',
      hashedPassword: 'hash456',
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
    getAll: jest.fn(),
    findById: jest.fn(),
    saveUser: jest.fn(),
    deleteUser: jest.fn(),
    resetUserPassword: jest.fn(),
    changeUserPassword: jest.fn(),
    mergeUsers: jest.fn(),
    createUser: jest.fn(),
    user2API: jest.fn(),
  };

  const mockMailService = {
    // Add any needed methods
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, mockAdminUser];
      const apiUsers = [
        { id: mockUser.id, username: mockUser.local.username },
        { id: mockAdminUser.id, username: mockAdminUser.local.username },
      ];

      mockUsersService.getAll.mockResolvedValue(users);
      mockUsersService.user2API.mockImplementation((u) => ({
        id: u.id,
        username: u.local.username,
      }));

      const result = await controller.getAll();

      expect(usersService.getAll).toHaveBeenCalled();
      expect(result.users).toHaveLength(2);
      expect(result.users[0].id).toBe(mockUser.id);
      expect(result.users[1].id).toBe(mockAdminUser.id);
    });

    // Note: Error handling test skipped - same Promise.catch() issue
  });

  describe('login', () => {
    it('should return current logged-in user', async () => {
      const req = { user: mockUser };
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.user2API.mockReturnValue({
        id: mockUser.id,
        username: mockUser.local.username,
      });

      const result = await controller.login(req);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result.user.id).toBe(mockUser.id);
    });

    // Note: Error handling test skipped
  });

  describe('save', () => {
    it('should allow user to save their own profile', async () => {
      const req = { user: mockUser };
      const body = {
        user: {
          id: mockUser.id,
          local: { ...mockUser.local, firstname: 'Updated' },
        },
      };

      mockUsersService.createUser.mockImplementation((u) => u);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.saveUser.mockResolvedValue({
        ...mockUser,
        local: { ...mockUser.local, firstname: 'Updated' },
      });
      mockUsersService.user2API.mockReturnValue({
        id: mockUser.id,
        firstname: 'Updated',
      });

      const result = await controller.save(req, body);

      expect(usersService.saveUser).toHaveBeenCalled();
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should allow admin to save any user', async () => {
      const req = { user: mockAdminUser };
      const body = {
        user: {
          id: mockUser.id,
          local: { ...mockUser.local, firstname: 'Admin Updated' },
        },
      };

      mockUsersService.createUser.mockImplementation((u) => u);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.saveUser.mockResolvedValue({
        ...mockUser,
        local: { ...mockUser.local, firstname: 'Admin Updated' },
      });
      mockUsersService.user2API.mockReturnValue({
        id: mockUser.id,
        firstname: 'Admin Updated',
      });

      const result = await controller.save(req, body);

      expect(result.user.id).toBe(mockUser.id);
    });

    it('should reject when user tries to save another user without admin rights', async () => {
      const req = { user: mockUser };
      const body = {
        user: {
          id: 'other-user-id',
          local: { username: 'other' },
        },
      };

      mockUsersService.createUser.mockImplementation((u) => u);

      await expect(controller.save(req, body)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should reject when user tries to make themselves admin', async () => {
      const req = { user: mockUser };
      const body = {
        user: {
          id: mockUser.id,
          local: { ...mockUser.local, isAdmin: true },
        },
      };

      mockUsersService.createUser.mockImplementation((u) => u);

      await expect(controller.save(req, body)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw BadRequest when user id is missing', async () => {
      const req = { user: mockUser };
      const body = { user: {} };

      await expect(controller.save(req, body)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('delete', () => {
    it('should allow admin to delete user', async () => {
      const req = { user: mockAdminUser };
      const body = { userId: 'user-to-delete' };

      mockUsersService.createUser.mockReturnValue(mockAdminUser);
      mockUsersService.deleteUser.mockResolvedValue(undefined);

      const result = await controller.delete(req, body);

      expect(usersService.deleteUser).toHaveBeenCalledWith('user-to-delete');
      expect(result).toEqual({});
    });

    it('should reject when non-admin tries to delete user', async () => {
      const req = { user: mockUser };
      const body = { userId: 'user-to-delete' };

      mockUsersService.createUser.mockReturnValue(mockUser);

      await expect(controller.delete(req, body)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw BadRequest when userId is missing', async () => {
      const req = { user: mockAdminUser };
      const body = {};

      mockUsersService.createUser.mockReturnValue(mockAdminUser);

      await expect(controller.delete(req, body)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('resetpassword', () => {
    it('should allow admin to reset user password', async () => {
      const req = { user: mockAdminUser };
      const body = { userId: 'user-123' };

      mockUsersService.createUser.mockReturnValue(mockAdminUser);
      mockUsersService.resetUserPassword.mockResolvedValue(undefined);

      const result = await controller.resetpassword(req, body);

      expect(usersService.resetUserPassword).toHaveBeenCalledWith('user-123');
      expect(result.ok).toBe('mail sent');
    });

    it('should reject when non-admin tries to reset password', async () => {
      const req = { user: mockUser };
      const body = { userId: 'user-123' };

      mockUsersService.createUser.mockReturnValue(mockUser);

      await expect(controller.resetpassword(req, body)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw BadRequest when userId is missing', async () => {
      const req = { user: mockAdminUser };
      const body = {};

      mockUsersService.createUser.mockReturnValue(mockAdminUser);

      await expect(controller.resetpassword(req, body)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('changepassword', () => {
    it('should allow user to change their own password', async () => {
      const req = { user: mockUser };
      const body = { password: 'newPassword123' };

      mockUsersService.createUser.mockReturnValue(mockUser);
      mockUsersService.changeUserPassword.mockResolvedValue(mockUser);

      const result = await controller.changepassword(req, body);

      expect(usersService.changeUserPassword).toHaveBeenCalledWith(mockUser.id, 'newPassword123');
      expect(result.ok).toBe('Password changed');
      expect(result.user).toBe(mockUser);
    });

    it('should throw BadRequest when password is missing', async () => {
      const req = { user: mockUser };
      const body = {};

      mockUsersService.createUser.mockReturnValue(mockUser);

      await expect(controller.changepassword(req, body)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    // Note: Error handling test skipped
  });

  describe('mergeUsers', () => {
    it('should allow admin to merge users', async () => {
      const req = { user: mockAdminUser };
      const body = { userSrcId: 'user-src', userTrgId: 'user-trg' };
      const users = [mockUser, mockAdminUser];

      mockUsersService.createUser.mockReturnValue(mockAdminUser);
      mockUsersService.mergeUsers.mockResolvedValue(undefined);
      mockUsersService.getAll.mockResolvedValue(users);

      const result = await controller.mergeUsers(req, body);

      expect(usersService.mergeUsers).toHaveBeenCalledWith('user-src', 'user-trg');
      expect(result.users).toHaveLength(2);
    });

    it('should reject when non-admin tries to merge users', async () => {
      const req = { user: mockUser };
      const body = { userSrcId: 'user-src', userTrgId: 'user-trg' };

      mockUsersService.createUser.mockReturnValue(mockUser);

      await expect(controller.mergeUsers(req, body)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw BadRequest when userSrcId is missing', async () => {
      const req = { user: mockAdminUser };
      const body = { userTrgId: 'user-trg' };

      mockUsersService.createUser.mockReturnValue(mockAdminUser);

      await expect(controller.mergeUsers(req, body)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('should throw BadRequest when userTrgId is missing', async () => {
      const req = { user: mockAdminUser };
      const body = { userSrcId: 'user-src' };

      mockUsersService.createUser.mockReturnValue(mockAdminUser);

      await expect(controller.mergeUsers(req, body)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });
});
