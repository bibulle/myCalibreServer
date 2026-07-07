import { User, UserAPI } from '@my-calibre-server/api-interfaces';
import { UserListItemComponent } from './user-list-item.component';
import { NotificationService } from '../../../notification/notification.service';
import { UserService } from '../../user.service';

describe('UserListItemComponent', () => {
  let component: UserListItemComponent;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  function makeUser(username = 'jdoe'): User {
    return { id: username, local: { username, isAdmin: false }, history: { lastConnection: new Date(), downloadedBooks: [], ratings: [] } } as User;
  }

  beforeEach(() => {
    mockUserService = {
      setUserAdmin: jest.fn(() => Promise.resolve({} as UserAPI)),
      remove: jest.fn(() => Promise.resolve()),
      resetPassword: jest.fn(() => Promise.resolve('ok')),
    } as any;
    mockNotificationService = { info: jest.fn(), error: jest.fn() } as any;

    component = new UserListItemComponent(mockUserService, mockNotificationService);
    component.user = makeUser();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleUserClosed', () => {
    it('should toggle the closed state', () => {
      expect(component.userClosed).toBe(true);
      component.toggleUserClosed();
      expect(component.userClosed).toBe(false);
    });

    it('should not toggle while this user is selected for merge', () => {
      component.selectedMergeUser = component.user;
      component.toggleUserClosed();
      expect(component.userClosed).toBe(true);
    });
  });

  describe('adminChanged', () => {
    it('should save the admin flag and notify', async () => {
      const originalUser = component.user;
      const newUser = makeUser();
      mockUserService.setUserAdmin.mockReturnValue(Promise.resolve(newUser as unknown as UserAPI));

      component.adminChanged({ checked: true } as any);
      await Promise.resolve();

      expect(mockUserService.setUserAdmin).toHaveBeenCalledWith(originalUser, true);
      expect(mockNotificationService.info).toHaveBeenCalledWith('User saved');
      expect(component.user).toBe(newUser);
    });

    it('should notify an error on failure', async () => {
      mockUserService.setUserAdmin.mockReturnValue(Promise.reject('boom'));

      component.adminChanged({ checked: true } as any);
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('remove', () => {
    it('should remove the user and emit listChanged', async () => {
      const spy = jest.spyOn(component.listChanged, 'emit');

      component.remove();
      await Promise.resolve();

      expect(mockUserService.remove).toHaveBeenCalledWith(component.user);
      expect(mockNotificationService.info).toHaveBeenCalledWith('User deleted');
      expect(spy).toHaveBeenCalledWith('user deleted');
    });

    it('should notify an error on failure', async () => {
      mockUserService.remove.mockReturnValue(Promise.reject({ statusText: 'boom' }));

      component.remove();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('resetPassword', () => {
    it('should reset the password and notify the result message', async () => {
      component.resetPassword();
      await Promise.resolve();

      expect(mockUserService.resetPassword).toHaveBeenCalledWith(component.user);
      expect(mockNotificationService.info).toHaveBeenCalledWith('ok');
    });
  });

  describe('merge', () => {
    it('should emit the mergeUser event with the current user', () => {
      const spy = jest.spyOn(component.mergeUser, 'emit');

      component.merge();

      expect(spy).toHaveBeenCalledWith(component.user);
    });
  });
});
