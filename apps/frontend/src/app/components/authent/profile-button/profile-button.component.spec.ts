import { Router } from '@angular/router';
import { User } from '@my-calibre-server/api-interfaces';
import { of } from 'rxjs';
import { ProfileButtonComponent } from './profile-button.component';
import { UserService } from '../user.service';

describe('ProfileButtonComponent', () => {
  let component: ProfileButtonComponent;
  let mockUserService: jest.Mocked<UserService>;
  let mockRouter: jest.Mocked<Router>;

  function makeUser(local: Partial<User['local']>): User {
    return { id: 'user-1', local } as User;
  }

  beforeEach(() => {
    mockUserService = {
      checkAuthent: jest.fn(),
      userObservable: jest.fn(() => of(makeUser({ username: 'jdoe' }))),
    } as any;

    mockRouter = {
      navigate: jest.fn(() => Promise.resolve(true)),
    } as any;

    component = new ProfileButtonComponent(mockUserService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should check authentication and subscribe to the current user', () => {
      component.ngOnInit();

      expect(mockUserService.checkAuthent).toHaveBeenCalled();
      expect(component.user.local.username).toBe('jdoe');
    });
  });

  describe('openProfile', () => {
    it('should navigate to /profile', () => {
      component.openProfile({} as Event, component.user);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('initials', () => {
    it('should use the first letters of first and last name when available', () => {
      component.user = makeUser({ firstname: 'Jane', lastname: 'Doe', username: 'jdoe' });
      expect(component.initials()).toBe('JD');
    });

    it('should fall back to the username first letter when no name is set', () => {
      component.user = makeUser({ username: 'jdoe' });
      expect(component.initials()).toBe('J');
    });

    it('should use only the first name initial when there is no last name', () => {
      component.user = makeUser({ firstname: 'Jane' });
      expect(component.initials()).toBe('J');
    });

    it('should return an empty string when there is nothing to initialize from', () => {
      component.user = makeUser({});
      expect(component.initials()).toBe('');
    });
  });
});
