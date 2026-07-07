import { Router } from '@angular/router';
import { User, UserAPI } from '@my-calibre-server/api-interfaces';
import { UserProfileComponent } from './user-profile.component';
import { NotificationService } from '../../../notification/notification.service';
import { UserService } from '../../user.service';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockRouter: jest.Mocked<Router>;

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-1',
      local: { username: 'jdoe', amazonEmails: [] },
      facebook: {},
      google: {},
      history: { lastConnection: new Date(), downloadedBooks: [], ratings: [] },
      ...overrides,
    } as User;
  }

  beforeEach(() => {
    jest.useFakeTimers();

    mockUserService = {
      save: jest.fn(() => Promise.resolve({} as UserAPI)),
      getUser: jest.fn(() => makeUser()),
      checkAuthent: jest.fn(),
      startLoginFacebook: jest.fn(() => Promise.resolve()),
      startLoginGoogle: jest.fn(() => Promise.resolve()),
      unlinkFacebook: jest.fn(() => Promise.resolve({} as UserAPI)),
      unlinkGoogle: jest.fn(() => Promise.resolve({} as UserAPI)),
    } as any;

    mockNotificationService = {
      message: jest.fn(),
      error: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(() => Promise.resolve(true)),
    } as any;

    component = new UserProfileComponent(mockUserService, mockNotificationService, mockRouter);
    component.user = makeUser();
    component.ngOnInit();
    component.ngOnChanges({ user: {} as any });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('userChange', () => {
    it('should save the user after the debounce delay when it changed', () => {
      component.user.local.firstname = 'John';
      component.userChange();

      jest.advanceTimersByTime(500);

      expect(mockUserService.save).toHaveBeenCalledWith(component.user);
    });

    it('should not save anything when nothing changed', () => {
      component.userChange();

      jest.advanceTimersByTime(500);

      expect(mockUserService.save).not.toHaveBeenCalled();
    });
  });

  describe('addEmail', () => {
    it('should add a trimmed amazon email and reset the input', () => {
      component.amazonEmail = ' kindle@example.com ';
      component.addEmail();

      expect(component.user.local.amazonEmails).toEqual(['kindle@example.com']);
      expect(component.amazonEmail).toBeUndefined();
    });

    it('should ignore an empty email', () => {
      component.amazonEmail = '   ';
      component.addEmail();

      expect(component.user.local.amazonEmails).toEqual([]);
    });

    it('should not add a duplicate email', () => {
      component.user.local.amazonEmails = ['kindle@example.com'];
      component.amazonEmail = 'kindle@example.com';
      component.addEmail();

      expect(component.user.local.amazonEmails).toEqual(['kindle@example.com']);
    });
  });

  describe('delEmail', () => {
    it('should remove the matching email', () => {
      component.user.local.amazonEmails = ['a@example.com', 'b@example.com'];
      component.delEmail('a@example.com');

      expect(component.user.local.amazonEmails).toEqual(['b@example.com']);
    });
  });

  describe('connectFacebook / connectGoogle', () => {
    it('should refuse to connect facebook for another user profile', () => {
      mockUserService.getUser.mockReturnValue(makeUser({ id: 'someone-else' }));

      component.connectFacebook();

      expect(mockNotificationService.error).toHaveBeenCalledWith('Not allowed');
      expect(mockUserService.startLoginFacebook).not.toHaveBeenCalled();
    });

    it('should start the facebook login flow for the current user', async () => {
      mockUserService.getUser.mockReturnValue(makeUser({ id: 'user-1' }));

      component.connectFacebook();
      await Promise.resolve();

      expect(mockUserService.startLoginFacebook).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should refuse to connect google for another user profile', () => {
      mockUserService.getUser.mockReturnValue(makeUser({ id: 'someone-else' }));

      component.connectGoogle();

      expect(mockNotificationService.error).toHaveBeenCalledWith('Not allowed');
      expect(mockUserService.startLoginGoogle).not.toHaveBeenCalled();
    });
  });

  describe('unlinkFacebook / unlinkGoogle', () => {
    it('should update the local facebook state when unlinking another profile than the logged in one', async () => {
      mockUserService.getUser.mockReturnValue(makeUser({ id: 'someone-else' }));
      mockUserService.unlinkFacebook.mockReturnValue(Promise.resolve({ facebook: { name: undefined } } as any));

      component.unlinkFacebook();
      await Promise.resolve();

      expect(mockUserService.unlinkFacebook).toHaveBeenCalledWith('user-1');
      expect(component.user.facebook).toEqual({ name: undefined });
    });

    it('should navigate when unlinking google from the currently logged in profile', async () => {
      mockUserService.getUser.mockReturnValue(makeUser({ id: 'user-1' }));

      component.unlinkGoogle();
      await Promise.resolve();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('openBook', () => {
    it('should navigate to the book page', () => {
      component.openBook(42);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/book', 42]);
    });
  });
});
