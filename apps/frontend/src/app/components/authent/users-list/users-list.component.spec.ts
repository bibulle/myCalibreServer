import { User, UserAPI } from '@my-calibre-server/api-interfaces';
import { UsersListComponent } from './users-list.component';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { UserService } from '../user.service';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockFilterService: jest.Mocked<FilterService>;

  function makeUser(username: string, isAdmin = false): User {
    return { id: username, local: { username, isAdmin }, history: { lastConnection: new Date(), downloadedBooks: [], ratings: [] } } as User;
  }

  beforeEach(() => {
    mockFilterService = { update: jest.fn() } as any;
    mockUserService = {
      getAll: jest.fn(() => Promise.resolve([makeUser('alice', true), makeUser('bob')] as UserAPI[])),
      merge: jest.fn(),
    } as any;
    mockNotificationService = { error: jest.fn() } as any;

    component = new UsersListComponent(mockUserService, mockNotificationService, mockFilterService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and load the users', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFilterService.update).toHaveBeenCalledWith(expect.any(Filter));
      expect(component.users.length).toBe(2);
    });

    it('should notify an error when loading users fails', async () => {
      mockUserService.getAll.mockReturnValue(Promise.reject('boom'));

      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('adminCount', () => {
    it('should count admin users', async () => {
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();

      expect(component.adminCount).toBe(1);
    });
  });

  describe('cancelMerge', () => {
    it('should clear the selected merge user', () => {
      component.selectedMergeUser = makeUser('alice');
      component.cancelMerge();
      expect(component.selectedMergeUser).toBeUndefined();
    });
  });

  describe('mergeUsers', () => {
    it('should select a user for merge when none is selected', () => {
      const alice = makeUser('alice');
      component.mergeUsers(alice);
      expect(component.selectedMergeUser).toBe(alice);
    });

    it('should unselect when the same user is clicked again', () => {
      const alice = makeUser('alice');
      component.selectedMergeUser = alice;
      component.mergeUsers(alice);
      expect(component.selectedMergeUser).toBeUndefined();
    });

    it('should merge the two selected users', async () => {
      const alice = makeUser('alice');
      const bob = makeUser('bob');
      const merged = [makeUser('alice')];
      mockUserService.merge.mockReturnValue(Promise.resolve(merged));
      component.selectedMergeUser = alice;

      component.mergeUsers(bob);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockUserService.merge).toHaveBeenCalledWith(alice, bob);
      expect(component.users).toBe(merged);
      expect(component.selectedMergeUser).toBeUndefined();
    });

    it('should notify an error when the merge fails', async () => {
      const alice = makeUser('alice');
      const bob = makeUser('bob');
      mockUserService.merge.mockReturnValue(Promise.reject('boom'));
      component.selectedMergeUser = alice;

      component.mergeUsers(bob);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('toggleSort', () => {
    it('should switch sort type and reset to ascending', () => {
      component.sort = component.SortType.LastActionDate;
      component.sort_direction = component.SortingDirection.Desc;

      component.toggleSort(component.SortType.UserName);

      expect(component.sort).toBe(component.SortType.UserName);
      expect(component.sort_direction).toBe(component.SortingDirection.Asc);
    });

    it('should toggle the direction when clicking the same sort type again', () => {
      component.sort = component.SortType.UserName;
      component.sort_direction = component.SortingDirection.Asc;

      component.toggleSort(component.SortType.UserName);

      expect(component.sort_direction).toBe(component.SortingDirection.Desc);
    });
  });
});
