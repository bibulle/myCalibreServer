import { Router } from '@angular/router';
import { User } from '@my-calibre-server/api-interfaces';
import { of } from 'rxjs';
import { ChangePasswordComponent } from './change-password.component';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { UserService } from '../user.service';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = { id: 'user-1', local: { username: 'jdoe' } } as User;

  beforeEach(() => {
    mockFilterService = { update: jest.fn() } as any;
    mockUserService = {
      userObservable: jest.fn(() => of(mockUser)),
      changePassword: jest.fn(() => Promise.resolve({} as User)),
    } as any;
    mockNotificationService = { info: jest.fn(), error: jest.fn() } as any;
    mockRouter = { navigate: jest.fn(() => Promise.resolve(true)) } as any;

    component = new ChangePasswordComponent(mockFilterService, mockUserService, mockNotificationService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and subscribe to the current user', () => {
      component.ngOnInit();

      expect(mockFilterService.update).toHaveBeenCalledWith(expect.any(Filter));
      expect(component.user).toEqual(mockUser);
    });
  });

  describe('change', () => {
    it('should be EMPTY when a password is empty', () => {
      component.password1 = '';
      component.password2 = '';
      component.change();
      expect(component.passwordsState).toBe(component.passwordsStateEnum.EMPTY);
    });

    it('should be DIFFERENTS when the passwords do not match', () => {
      component.password1 = 'abc';
      component.password2 = 'def';
      component.change();
      expect(component.passwordsState).toBe(component.passwordsStateEnum.DIFFERENTS);
    });

    it('should be OK when the passwords match', () => {
      component.password1 = 'abc';
      component.password2 = 'abc';
      component.change();
      expect(component.passwordsState).toBe(component.passwordsStateEnum.OK);
    });
  });

  describe('save', () => {
    it('should change the password and navigate to the profile page on success', async () => {
      const event = { preventDefault: jest.fn() } as unknown as Event;
      component.password1 = 'newpass';

      component.save(event);
      await Promise.resolve();
      await Promise.resolve();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUserService.changePassword).toHaveBeenCalledWith('newpass');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should notify an error when it fails', async () => {
      mockUserService.changePassword.mockReturnValue(Promise.reject('boom'));
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.save(event);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });
});
