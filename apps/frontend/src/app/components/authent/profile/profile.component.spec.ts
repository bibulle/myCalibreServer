import { Router } from '@angular/router';
import { User } from '@my-calibre-server/api-interfaces';
import { of } from 'rxjs';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { ProfileComponent } from './profile.component';
import { UserService } from '../user.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = { id: 'user-1', local: { username: 'jdoe' } } as User;

  beforeEach(() => {
    mockFilterService = {
      update: jest.fn(),
    } as any;

    mockUserService = {
      checkAuthent: jest.fn(),
      userObservable: jest.fn(() => of(mockUser)),
      isUserAdmin: jest.fn(() => false),
      logout: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(() => Promise.resolve(true)),
    } as any;

    component = new ProfileComponent(mockFilterService, mockUserService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and subscribe to the current user', () => {
      component.ngOnInit();

      expect(mockFilterService.update).toHaveBeenCalledWith(expect.any(Filter));
      expect(mockUserService.checkAuthent).toHaveBeenCalled();
      expect(component.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should log out and navigate home', () => {
      component.logout();

      expect(mockUserService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('isAdmin', () => {
    it('should reflect UserService.isUserAdmin', () => {
      mockUserService.isUserAdmin.mockReturnValue(true);
      expect(component.isAdmin()).toBe(true);

      mockUserService.isUserAdmin.mockReturnValue(false);
      expect(component.isAdmin()).toBe(false);
    });
  });

  describe('openAdmin', () => {
    it('should navigate to the users administration page', () => {
      component.openAdmin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    });
  });

  describe('goLibrary', () => {
    it('should navigate to the home page', () => {
      component.goLibrary();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('initials', () => {
    it('should use firstname/lastname initials when available', () => {
      component.user = { local: { username: 'jdoe', firstname: 'John', lastname: 'Doe' } } as User;
      expect(component.initials()).toBe('JD');
    });

    it('should fall back to the username initial', () => {
      component.user = { local: { username: 'jdoe' } } as User;
      expect(component.initials()).toBe('J');
    });
  });

  describe('displayName', () => {
    it('should use firstname/lastname when available', () => {
      component.user = { local: { username: 'jdoe', firstname: 'John', lastname: 'Doe' } } as User;
      expect(component.displayName()).toBe('John Doe');
    });

    it('should fall back to the username', () => {
      component.user = { local: { username: 'jdoe' } } as User;
      expect(component.displayName()).toBe('jdoe');
    });
  });
});
