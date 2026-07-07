import { Router } from '@angular/router';
import { Version } from '@my-calibre-server/api-interfaces';
import { SignupComponent } from './signup.component';
import { FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { TitleService } from '../../../app/title.service';
import { UserService } from '../user.service';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockTitleService: jest.Mocked<TitleService>;
  let mockRouter: jest.Mocked<Router>;

  function makeVersion(version: string): Version {
    return { version, github_url: '', name: '', copyright: '' } as Version;
  }

  beforeEach(() => {
    mockFilterService = { update: jest.fn() } as any;
    mockUserService = { signup: jest.fn(() => Promise.resolve({} as any)) } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockTitleService = { getVersion: jest.fn(() => Promise.resolve(makeVersion('1.2.3'))) } as any;
    mockRouter = { navigate: jest.fn() } as any;

    component = new SignupComponent(mockFilterService, mockUserService, mockNotificationService, mockTitleService, mockRouter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should hide the header filter and fetch the version', async () => {
      component.ngOnInit();
      await Promise.resolve();

      expect(mockFilterService.update).toHaveBeenCalledWith(expect.objectContaining({ not_displayed: true }));
      expect(mockTitleService.getVersion).toHaveBeenCalled();
      expect(component.version.version).toBe('1.2.3');
    });
  });

  describe('isVersionBeta', () => {
    it('should be true for a 0.x version', () => {
      component.version = makeVersion('0.12.22');
      expect(component.isVersionBeta()).toBe(true);
    });

    it('should be false for a 1.x version', () => {
      component.version = makeVersion('1.0.0');
      expect(component.isVersionBeta()).toBe(false);
    });
  });

  describe('signup', () => {
    it('should sign up and navigate home on success', async () => {
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.signup(event, 'jdoe', 'secret', 'John', 'Doe', 'jdoe@example.com');
      await Promise.resolve();
      await Promise.resolve();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUserService.signup).toHaveBeenCalledWith('jdoe', 'secret', 'John', 'Doe', 'jdoe@example.com');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
    });

    it('should notify an error when signup fails', async () => {
      mockUserService.signup.mockReturnValue(Promise.reject('boom'));
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.signup(event, 'jdoe', 'secret', 'John', 'Doe', 'jdoe@example.com');
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('login', () => {
    it('should navigate to the login page', () => {
      component.login();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
