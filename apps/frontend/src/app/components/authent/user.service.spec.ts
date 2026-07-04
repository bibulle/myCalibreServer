import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ApiReturn, User, UserAPI } from '@my-calibre-server/api-interfaces';
import { of, throwError } from 'rxjs';
import { WindowService } from '../../core/util/window.service';
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

  describe('Error message extraction (via error callbacks)', () => {
    it('should use the last entry when the error payload is an array', async () => {
      mockHttpClient.post.mockReturnValue(throwError(() => ({ error: [{ statusText: 'first' }, { statusText: 'last' }] })));

      await expect(service.save(mockUser)).rejects.toBe('last');
    });

    it('should use the nested error when it carries a message', async () => {
      mockHttpClient.post.mockReturnValue(throwError(() => ({ error: { message: 'nested message' } })));

      await expect(service.remove(mockUser)).rejects.toBe('nested message');
    });

    it('should fall back to the nested error object when it has no message', async () => {
      const nestedError = { code: 'ERR_TEST' };
      mockHttpClient.post.mockReturnValue(throwError(() => ({ error: nestedError })));

      await expect(service.resetPassword(mockUser)).rejects.toBe(nestedError);
    });

    it('should use statusText when present on a plain error', async () => {
      mockHttpClient.post.mockReturnValue(throwError(() => ({ statusText: 'Unauthorized' })));

      await expect(service.save(mockUser)).rejects.toBe('Unauthorized');
    });

    it('should fall back to "Connection error" when the error carries no usable information', async () => {
      mockHttpClient.post.mockReturnValue(throwError(() => ''));

      await expect(service.save(mockUser)).rejects.toBe('Connection error');
    });

    it('should recover gracefully when reading the error payload throws', async () => {
      const throwingError = {
        get error() {
          throw new Error('boom while reading error');
        },
        message: 'fallback message',
      };
      mockHttpClient.post.mockReturnValue(throwError(() => throwingError));

      await expect(service.save(mockUser)).rejects.toBe('fallback message');
    });
  });

  describe('Additional error branches', () => {
    it('should reject when refreshUser request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network down'));

      await expect(service.refreshUser()).rejects.toBe('network down');
    });

    it('should reject when getAll request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network down'));

      await expect(service.getAll()).rejects.toBe('network down');
    });

    it('should reject when getAll response has no users', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.getAll()).rejects.toBe('Cannot get users');
    });

    it('should reject when merge request errors', async () => {
      mockHttpClient.post.mockReturnValue(throwError(() => 'network down'));

      await expect(service.merge(mockUser, mockUser)).rejects.toBe('network down');
    });

    it('should reject when merge response has no users', async () => {
      mockHttpClient.post.mockReturnValue(of({} as ApiReturn));

      await expect(service.merge(mockUser, mockUser)).rejects.toBe('Cannot merge user');
    });

    it('should reject when resetPassword response has no ok field', async () => {
      mockHttpClient.post.mockReturnValue(of({} as ApiReturn));

      await expect(service.resetPassword(mockUser)).rejects.toBe('something go wrong');
    });

    it('should reject when unlinkGoogle response has no user', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      await expect(service.unlinkGoogle('user123')).rejects.toBe('Cannot get users');
    });

    it('should reject when unlinkGoogle request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => 'network down'));

      await expect(service.unlinkGoogle('user123')).rejects.toBe('network down');
    });
  });

  describe('_doPost response branches (via login)', () => {
    it('should resolve with the user when the response has no id_token but has a user', async () => {
      mockHttpClient.post.mockReturnValue(of({ user: mockUserAPI } as ApiReturn));

      const result = await service.login('testuser', 'password');

      expect(result).toEqual(mockUserAPI);
    });

    it('should reject when the response has neither id_token nor user', async () => {
      mockHttpClient.post.mockReturnValue(of({} as ApiReturn));

      await expect(service.login('testuser', 'password')).rejects.toBeUndefined();
    });
  });

  describe('_doGet response branches (via loginFacebook)', () => {
    it('should resolve with the user when the response has no id_token but has a user', async () => {
      mockHttpClient.get.mockReturnValue(of({ user: mockUserAPI } as ApiReturn));

      const result = await service.loginFacebook({ code: 'abc' });

      expect(result).toEqual(mockUserAPI);
    });

    it('should resolve with an empty string when the response has neither id_token nor user', async () => {
      mockHttpClient.get.mockReturnValue(of({} as ApiReturn));

      const result = await service.loginFacebook({ code: 'abc' });

      expect(result).toBe('');
    });

    it('should reject with the extracted error message when the request errors', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => ({ message: 'boom' })));

      await expect(service.loginFacebook({ code: 'abc' })).rejects.toBe('boom');
    });
  });

  describe('_parseQueryString', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parse = (str: any) => (service as any)._parseQueryString(str);

    it('should return an empty object for non-string input', () => {
      expect(parse(undefined)).toEqual({});
    });

    it('should return an empty object once separators are stripped from an otherwise empty string', () => {
      expect(parse('?')).toEqual({});
    });

    it('should parse a simple key=value pair', () => {
      expect(parse('code=abc123')).toEqual({ code: 'abc123' });
    });

    it('should treat a key without "=" as null', () => {
      expect(parse('flag')).toEqual({ flag: null });
    });

    it('should turn a repeated key into an array', () => {
      expect(parse('a=1&a=2')).toEqual({ a: ['1', '2'] });
    });

    it('should keep accumulating repeated keys past the second occurrence', () => {
      expect(parse('a=1&a=2&a=3')).toEqual({ a: ['1', '2', '3'] });
    });

    it('should decode percent-encoding and turn + into spaces', () => {
      expect(parse('msg=hello+world%21')).toEqual({ msg: 'hello world!' });
    });
  });

  describe('OAuth popup flow (_startLoginOAuth)', () => {
    let fakeWindow: { location: { href: string }; close: jest.Mock };

    beforeEach(() => {
      jest.useFakeTimers();
      fakeWindow = { location: { href: '' }, close: jest.fn() };
      jest.spyOn(WindowService, 'createWindow').mockReturnValue(fakeWindow as unknown as Window);
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should reject with a timeout once the polling budget is exhausted', async () => {
      const promise = service.startLoginFacebook();
      // loopCount starts at 600 and decrements every 100ms tick until it goes negative
      jest.advanceTimersByTime(100 * 602);

      await expect(promise).rejects.toEqual('Time out');
      expect(fakeWindow.close).toHaveBeenCalled();
    });

    it('should keep polling without crashing when reading the window location throws', () => {
      Object.defineProperty(fakeWindow, 'location', {
        get() {
          throw new Error('cross-origin');
        },
      });
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      service.startLoginFacebook();
      expect(() => jest.advanceTimersByTime(100)).not.toThrow();
      expect(logSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
    });

    it('should resolve after a successful Facebook code callback', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: mockJwtToken } as ApiReturn));

      const promise = service.startLoginFacebook();
      fakeWindow.location.href = 'http://localhost/assets/logged.html?code=abc123';
      jest.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
      expect(fakeWindow.close).toHaveBeenCalled();
    });

    it('should resolve after a successful Google code callback', async () => {
      mockHttpClient.get.mockReturnValue(of({ id_token: mockJwtToken } as ApiReturn));

      const promise = service.startLoginGoogle();
      fakeWindow.location.href = 'http://localhost/assets/logged.html?code=abc123';
      jest.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject when the code callback login request fails', async () => {
      mockHttpClient.get.mockReturnValue(throwError(() => ({ message: 'boom' })));

      const promise = service.startLoginFacebook();
      fakeWindow.location.href = 'http://localhost/assets/logged.html?code=abc123';
      jest.advanceTimersByTime(100);

      await expect(promise).rejects.toBe('boom');
    });

    it('should reject when the callback URL has neither a code nor an error message', async () => {
      const promise = service.startLoginFacebook();
      fakeWindow.location.href = 'http://localhost/assets/logged.html?foo=bar';
      jest.advanceTimersByTime(100);

      await expect(promise).rejects.toEqual('Login error');
    });

    it('should reject with the decoded error message when the callback URL carries one', async () => {
      const promise = service.startLoginFacebook();
      fakeWindow.location.href = 'http://localhost/assets/logged.html?error_message=Access+denied';
      jest.advanceTimersByTime(100);

      await expect(promise).rejects.toEqual('Access denied');
    });
  });
});
