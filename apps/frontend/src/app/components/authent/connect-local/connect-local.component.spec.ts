import { Router } from '@angular/router';
import { ConnectLocalComponent } from './connect-local.component';
import { FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { UserService } from '../user.service';

describe('ConnectLocalComponent', () => {
  let component: ConnectLocalComponent;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    mockFilterService = { update: jest.fn() } as any;
    mockUserService = { connectLocal: jest.fn(() => Promise.resolve({} as any)) } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockRouter = { navigate: jest.fn() } as any;

    component = new ConnectLocalComponent(mockFilterService, mockUserService, mockNotificationService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter', () => {
      component.ngOnInit();

      expect(mockFilterService.update).toHaveBeenCalledWith(expect.objectContaining({ not_displayed: true }));
    });
  });

  describe('connect', () => {
    it('should connect the local account and navigate to the profile page on success', async () => {
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.connect(event, 'jdoe', 'secret');
      await Promise.resolve();
      await Promise.resolve();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUserService.connectLocal).toHaveBeenCalledWith('jdoe', 'secret');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should notify an error when connecting fails', async () => {
      mockUserService.connectLocal.mockReturnValue(Promise.reject('boom'));
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.connect(event, 'jdoe', 'wrong');
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });
});
