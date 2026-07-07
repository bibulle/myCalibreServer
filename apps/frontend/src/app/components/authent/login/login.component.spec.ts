import { Router } from '@angular/router';
import { Version } from '@my-calibre-server/api-interfaces';
import { LoginComponent } from './login.component';
import { FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { TitleService } from '../../../app/title.service';
import { UserService } from '../user.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
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
    mockUserService = {
      logout: jest.fn(),
      login: jest.fn(() => Promise.resolve({} as any)),
      startLoginGoogle: jest.fn(() => Promise.resolve()),
      startLoginFacebook: jest.fn(() => Promise.resolve()),
    } as any;
    mockNotificationService = { error: jest.fn() } as any;
    mockTitleService = { getVersion: jest.fn(() => Promise.resolve(makeVersion('1.2.3'))) } as any;
    mockRouter = { navigate: jest.fn() } as any;

    component = new LoginComponent(mockFilterService, mockUserService, mockNotificationService, mockTitleService, mockRouter);
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

  describe('login', () => {
    it('should log out, log in and navigate home on success', async () => {
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.login(event, 'jdoe', 'secret');
      await Promise.resolve();
      await Promise.resolve();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockUserService.logout).toHaveBeenCalled();
      expect(mockUserService.login).toHaveBeenCalledWith('jdoe', 'secret');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should notify an error when login fails', async () => {
      mockUserService.login.mockReturnValue(Promise.reject('boom'));
      const event = { preventDefault: jest.fn() } as unknown as Event;

      component.login(event, 'jdoe', 'wrong');
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('startLoginGoogle', () => {
    it('should log out and navigate home on success', async () => {
      component.startLoginGoogle();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockUserService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
    });

    it('should notify an error on failure', async () => {
      mockUserService.startLoginGoogle.mockReturnValue(Promise.reject('boom'));

      component.startLoginGoogle();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('startLoginFacebook', () => {
    it('should log out and navigate home on success', async () => {
      component.startLoginFacebook();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockUserService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
    });

    it('should notify an error on failure', async () => {
      mockUserService.startLoginFacebook.mockReturnValue(Promise.reject('boom'));

      component.startLoginFacebook();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockNotificationService.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('signup', () => {
    it('should navigate to the signup page', () => {
      component.signup();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['signup']);
    });
  });
});
