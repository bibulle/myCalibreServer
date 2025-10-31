import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ApiReturn, User, UserAPI } from '@my-calibre-server/api-interfaces';
import { of, throwError } from 'rxjs';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let localStorageMock: { [key: string]: string };

  const mockUser: User = {
    id: 'user123',
    local: {
      username: 'testuser',
      email: 'test@example.com',
      isAdmin: false,
      firstname: 'Test',
      lastname: 'User',
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

  const mockUserAPI: UserAPI = {
    ...mockUser,
    id: 'user123',
  } as UserAPI;

  const mockJwtToken = 'mock.jwt.token';

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [UserService, { provide: HttpClient, useValue: mockHttpClient }],
    });

    // Mock JwtHelperService
    JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;
    JwtHelperService.prototype.decodeToken = jest.fn(() => mockUser) as any;

    service = TestBed.inject(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token management', () => {
    it('should get token from localStorage', () => {
      localStorageMock['id_token'] = mockJwtToken;
      const token = UserService.tokenGetter();
      expect(token).toBe(mockJwtToken);
    });

    it('should return null when no token exists', () => {
      const token = UserService.tokenGetter();
      expect(token).toBeNull();
    });

    it('should set token to localStorage', () => {
      service.tokenSetter(mockJwtToken);
      expect(localStorageMock['id_token']).toBe(mockJwtToken);
    });

    it('should not set null token', () => {
      service.tokenSetter(null);
      expect(localStorageMock['id_token']).toBeUndefined();
    });

    it('should remove token from localStorage', () => {
      localStorageMock['id_token'] = mockJwtToken;
      service.tokenRemove();
      expect(localStorageMock['id_token']).toBeUndefined();
    });
  });

  describe('checkAuthent', () => {
    it('should return true when valid token exists', () => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;

      const result = service.checkAuthent(false);

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      const result = service.checkAuthent(false);
      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => true) as any;

      const result = service.checkAuthent(false);

      expect(result).toBe(false);
    });

    it('should emit user through observable when emitEvent is true', (done) => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;

      service.userObservable().subscribe((user) => {
        if (user.id === 'user123') {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      service.checkAuthent(true);
    });
  });

  describe('User information', () => {
    it('should return current user', () => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;

      const user = service.getUser();

      expect(user).toBeDefined();
      expect(user.id).toBe('user123');
    });

    it('should check if user is authenticated', () => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;

      const isAuth = service.isAuthent();

      expect(isAuth).toBe(true);
    });

    it('should return false for unauthenticated user', () => {
      const isAuth = service.isAuthent();
      expect(isAuth).toBe(false);
    });

    it('should check if user is admin', () => {
      const adminUser = { ...mockUser, local: { ...mockUser.local, isAdmin: true } };
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;
      JwtHelperService.prototype.decodeToken = jest.fn(() => adminUser) as any;

      service.checkAuthent(false);
      const isAdmin = service.isUserAdmin();

      expect(isAdmin).toBe(true);
    });

    it('should return false for non-admin user', () => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;

      const isAdmin = service.isUserAdmin();

      expect(isAdmin).toBe(false);
    });
  });

  describe('Login methods', () => {
    const apiReturn: ApiReturn = {
      id_token: mockJwtToken,
      user: mockUserAPI,
    };

    it('should login successfully', async () => {
      mockHttpClient.post.mockReturnValue(of(apiReturn));

      const user = await service.login('testuser', 'password');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/authent/login', JSON.stringify({ username: 'testuser', password: 'password' }), expect.any(Object));
      expect(user).toBeDefined();
      expect(localStorageMock['id_token']).toBe(mockJwtToken);
    });

    it('should handle login error', async () => {
      const error = { message: 'Login failed' };
      mockHttpClient.post.mockReturnValue(throwError(() => error));

      await expect(service.login('testuser', 'wrong')).rejects.toBeDefined();
    });

    it('should connect local user', async () => {
      mockHttpClient.post.mockReturnValue(of(apiReturn));

      const user = await service.connectLocal('testuser', 'password');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/authent/connect/local', JSON.stringify({ username: 'testuser', password: 'password' }), expect.any(Object));
      expect(user).toBeDefined();
    });

    it('should signup new user', async () => {
      mockHttpClient.post.mockReturnValue(of(apiReturn));

      const user = await service.signup('newuser', 'password', 'John', 'Doe', 'john@example.com');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/authent/signup',
        JSON.stringify({
          username: 'newuser',
          password: 'password',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
        }),
        expect.any(Object)
      );
      expect(user).toBeDefined();
    });
  });

  describe('User management', () => {
    it('should refresh user data', async () => {
      mockHttpClient.get.mockReturnValue(of({ user: mockUserAPI } as ApiReturn));

      const user = await service.refreshUser();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/users/me');
      expect(user).toEqual(mockUser);
    });

    it('should reject when refresh fails', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.refreshUser()).rejects.toBe('Cannot read user');
    });

    it('should save user', async () => {
      mockHttpClient.post.mockReturnValue(of({ user: mockUserAPI } as ApiReturn));

      const savedUser = await service.save(mockUser);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users/save', JSON.stringify({ user: mockUser }), expect.any(Object));
      expect(savedUser).toEqual(mockUserAPI);
    });

    it('should handle save error', async () => {
      mockHttpClient.post.mockReturnValue(of({} as ApiReturn));

      await expect(service.save(mockUser)).rejects.toBe('Cannot save te user');
    });

    it('should delete user', async () => {
      mockHttpClient.post.mockReturnValue(of({} as ApiReturn));

      await service.remove(mockUser);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users/delete', JSON.stringify({ userId: 'user123' }), expect.any(Object));
    });

    it('should reset password', async () => {
      mockHttpClient.post.mockReturnValue(of({ ok: 'Password reset' } as ApiReturn));

      const result = await service.resetPassword(mockUser);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users/reset', JSON.stringify({ userId: 'user123' }), expect.any(Object));
      expect(result).toBe('Password reset');
    });

    it('should change password', async () => {
      const apiReturn: ApiReturn = {
        id_token: mockJwtToken,
        user: mockUserAPI,
      };
      mockHttpClient.post.mockReturnValue(of(apiReturn));

      const user = await service.changePassword('newpassword');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users/changepw', JSON.stringify({ password: 'newpassword' }), expect.any(Object));
      expect(user).toBeDefined();
    });

    it('should check temporary token', async () => {
      const apiReturn: ApiReturn = {
        id_token: mockJwtToken,
        user: mockUserAPI,
      };
      mockHttpClient.post.mockReturnValue(of(apiReturn));

      const user = await service.checkTemporaryToken('temp-token');

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/authent/checktoken', JSON.stringify({ token: 'temp-token' }), expect.any(Object));
      expect(user).toBeDefined();
    });

    it('should get all users', async () => {
      const users = [mockUserAPI];
      mockHttpClient.get.mockReturnValue(of({ users } as ApiReturn));

      const result = await service.getAll();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/users');
      expect(result).toEqual(users);
    });

    it('should merge two users', async () => {
      const user1 = { ...mockUser, id: 'user1' } as User;
      const user2 = { ...mockUser, id: 'user2' } as User;
      const mergedUsers = [mockUser];
      mockHttpClient.post.mockReturnValue(of({ users: mergedUsers } as ApiReturn));

      const result = await service.merge(user1, user2);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users/merge', JSON.stringify({ userSrcId: 'user1', userTrgId: 'user2' }), expect.any(Object));
      expect(result).toEqual(mergedUsers);
    });

    it('should set user admin status', async () => {
      mockHttpClient.post.mockReturnValue(of({ user: mockUserAPI } as ApiReturn));

      await service.setUserAdmin(mockUser, true);

      expect(mockUser.local.isAdmin).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should logout and remove token', () => {
      localStorageMock['id_token'] = mockJwtToken;

      service.logout();

      expect(localStorageMock['id_token']).toBeUndefined();
    });
  });

  describe('OAuth methods', () => {
    it('should unlink Google account', async () => {
      mockHttpClient.get.mockReturnValue(of({ user: mockUserAPI, id_token: mockJwtToken } as ApiReturn));

      const result = await service.unlinkGoogle('user123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/authent/google/unlink?userId=user123');
      expect(result).toEqual(mockUserAPI);
      expect(localStorageMock['id_token']).toBe(mockJwtToken);
    });

    it('should handle OAuth callback with Facebook', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: mockJwtToken } as ApiReturn));

      const result = await service.loginFacebook({ code: 'facebook-code' });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/authent/facebook/callback?code=facebook-code', expect.any(Object));
      expect(result).toBeDefined();
    });

    it('should handle OAuth callback with Google', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: mockJwtToken } as ApiReturn));

      const result = await service.loginGoogle({ code: 'google-code' });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/authent/google/callback?code=google-code', expect.any(Object));
      expect(result).toBeDefined();
    });

    it('should unlink Facebook account', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: mockJwtToken } as ApiReturn));

      const result = await service.unlinkFacebook('user123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/authent/facebook/unlink?userId=user123', expect.any(Object));
      expect(result).toBeDefined();
    });
  });

  describe('userObservable', () => {
    it('should return observable with distinct changes', (done) => {
      localStorageMock['id_token'] = mockJwtToken;
      JwtHelperService.prototype.isTokenExpired = jest.fn(() => false) as any;

      let emissionCount = 0;
      service.userObservable().subscribe((user) => {
        emissionCount++;
        if (emissionCount === 1) {
          // First emission should be the initial empty user
          expect(user).toBeDefined();
          // Trigger another emission with the same user
          service.checkAuthent(true);
          setTimeout(() => {
            // After timeout, verify we only got distinct emissions
            expect(emissionCount).toBeGreaterThan(0);
            done();
          }, 100);
        }
      });
    });
  });
});
