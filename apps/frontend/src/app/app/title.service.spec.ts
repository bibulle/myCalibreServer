import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { Title, Version } from '@my-calibre-server/api-interfaces';
import { of, Subject, throwError } from 'rxjs';
import { TitleService } from './title.service';

describe('TitleService', () => {
  let service: TitleService;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockRouter: jest.Mocked<Router>;
  let mockLocation: jest.Mocked<Location>;
  let routerEventsSubject: Subject<any>;

  const mockVersion: Version = {
    version: '1.2.3',
    buildDate: new Date(),
    github_url: 'https://github.com/test',
    name: 'Test App',
    copyright: '2025',
  } as Version;

  beforeEach(() => {
    routerEventsSubject = new Subject();

    mockHttpClient = {
      get: jest.fn(),
    } as any;

    mockRouter = {
      events: routerEventsSubject.asObservable(),
      navigateByUrl: jest.fn(() => Promise.resolve(true)),
    } as any;

    mockLocation = {
      back: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [TitleService, { provide: HttpClient, useValue: mockHttpClient }, { provide: Router, useValue: mockRouter }, { provide: Location, useValue: mockLocation }],
    });

    service = TestBed.inject(TitleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty title history', () => {
    expect(service['titles']).toEqual([]);
  });

  describe('Router events handling', () => {
    it('should add title on RoutesRecognized', () => {
      const routesRecognized = new RoutesRecognized(1, '/test', '/test', {
        root: {
          firstChild: {
            data: { label: 'Test Page' },
          },
        },
      } as any);

      routerEventsSubject.next(routesRecognized);

      expect(service['titles'].length).toBe(1);
      expect(service['titles'][0].title).toBe('Test Page');
      expect(service['titles'][0].url).toBe('/test');
    });

    it('should add backUrl from previous title', () => {
      // Add first title
      const firstRoute = new RoutesRecognized(1, '/first', '/first', {
        root: {
          firstChild: {
            data: { label: 'First Page' },
          },
        },
      } as any);
      routerEventsSubject.next(firstRoute);

      // Add second title
      const secondRoute = new RoutesRecognized(2, '/second', '/second', {
        root: {
          firstChild: {
            data: { label: 'Second Page' },
          },
        },
      } as any);
      routerEventsSubject.next(secondRoute);

      expect(service['titles'][0].backUrl).toBe('/first');
    });

    it('should remove title on NavigationCancel', () => {
      // Add a title first
      const routesRecognized = new RoutesRecognized(1, '/test', '/test', {
        root: {
          firstChild: {
            data: { label: 'Test Page' },
          },
        },
      } as any);
      routerEventsSubject.next(routesRecognized);

      expect(service['titles'].length).toBe(1);

      // Cancel navigation
      const navigationCancel = new NavigationCancel(1, '/test', 'cancelled');
      routerEventsSubject.next(navigationCancel);

      expect(service['titles'].length).toBe(0);
    });

    it('should update title on NavigationEnd', () => {
      const updateSpy = jest.spyOn(service, 'update');

      // Add a title first
      const routesRecognized = new RoutesRecognized(1, '/test', '/test', {
        root: {
          firstChild: {
            data: { label: 'Test Page' },
          },
        },
      } as any);
      routerEventsSubject.next(routesRecognized);

      // Complete navigation
      const navigationEnd = new NavigationEnd(1, '/test', '/test');
      routerEventsSubject.next(navigationEnd);

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should limit title history to 100 entries', () => {
      // Add 110 titles
      for (let i = 0; i < 110; i++) {
        const routesRecognized = new RoutesRecognized(i, `/page${i}`, `/page${i}`, {
          root: {
            firstChild: {
              data: { label: `Page ${i}` },
            },
          },
        } as any);
        routerEventsSubject.next(routesRecognized);
      }

      expect(service['titles'].length).toBe(100);
    });
  });

  describe('goBack', () => {
    it('should navigate to backUrl when available', () => {
      // Add two titles
      service['titles'] = [{ url: '/current', backUrl: '/previous', title: 'Current' } as Title, { url: '/previous', title: 'Previous' } as Title, { url: '/older', title: 'Older' } as Title];

      service.goBack();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/previous');
      expect(service['titles'].length).toBe(1);
      expect(service['titles'][0].url).toBe('/older');
    });

    it('should use location.back when no backUrl', () => {
      service['titles'] = [{ url: '/current', title: 'Current' } as Title];

      service.goBack();

      expect(mockLocation.back).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should use location.back when only one title', () => {
      service['titles'] = [{ url: '/current', backUrl: '/previous', title: 'Current' } as Title];

      service.goBack();

      expect(mockLocation.back).toHaveBeenCalled();
    });
  });

  describe('forceTitle', () => {
    it('should update title for matching URL', () => {
      const title = new Title('Original', undefined, 1, '/test');
      service['titles'] = [title];

      service.forceTitle('/test', 'Forced Title');

      expect(service['titles'][0].title).toBe('Forced Title');
      expect(service['titles'][0].book_title).toBe(true);
    });

    it('should not update title for non-matching URL', () => {
      const title = new Title('Original', undefined, 1, '/test');
      service['titles'] = [title];

      service.forceTitle('/other', 'Forced Title');

      expect(service['titles'][0].title).toBe('Original');
      expect(service['titles'][0].book_title).toBe(false);
    });

    it('should throw error when title array is empty', () => {
      service['titles'] = [];
      expect(() => service.forceTitle('/test', 'Title')).toThrow();
    });
  });

  describe('update', () => {
    it('should emit title through observable', (done) => {
      const testTitle = new Title('Test', undefined, 1, '/test');

      service.currentTitleObservable().subscribe((title) => {
        if (title.title === 'Test') {
          expect(title).toBe(testTitle);
          done();
        }
      });

      service.update(testTitle);
    });
  });

  describe('currentTitleObservable', () => {
    it('should return observable', () => {
      const observable = service.currentTitleObservable();
      expect(observable).toBeDefined();
      expect(observable.subscribe).toBeDefined();
    });

    it('should emit current title immediately on subscription', (done) => {
      service.currentTitleObservable().subscribe((title) => {
        expect(title).toBeInstanceOf(Title);
        done();
      });
    });
  });

  describe('getVersion', () => {
    it('should fetch version from API on first call', async () => {
      mockHttpClient.get.mockReturnValue(of({ version: mockVersion }));

      const version = await service.getVersion();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/version');
      expect(version).toEqual(mockVersion);
    });

    it('should return cached version on subsequent calls', async () => {
      mockHttpClient.get.mockReturnValue(of({ version: mockVersion }));

      // First call
      await service.getVersion();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      // Second call
      const version = await service.getVersion();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1); // Not called again
      expect(version).toEqual(mockVersion);
    });

    it('should reject when version is not in response', async () => {
      mockHttpClient.get.mockReturnValue(of({}));

      await expect(service.getVersion()).rejects.toBe('Cannot get version');
    });

    it('should reject on HTTP error', async () => {
      const error = { message: 'Network error' };
      mockHttpClient.get.mockReturnValue(throwError(() => error));

      await expect(service.getVersion()).rejects.toEqual(error);
    });
  });
});
