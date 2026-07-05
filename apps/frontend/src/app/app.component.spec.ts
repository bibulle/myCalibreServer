import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { TitleService } from './app/title.service';
import { UserService } from './components/authent/user.service';
import { Filter, FilterService } from './components/filter-bar/filter.service';
import { ThemeService } from './core/theme/theme.service';
import { Title, User } from '@my-calibre-server/api-interfaces';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockUserService: jest.Mocked<UserService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockTitleService: jest.Mocked<TitleService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: { snapshot: Partial<ActivatedRouteSnapshot> };
  let mockTranslateService: jest.Mocked<TranslateService>;
  let mockMatIconRegistry: jest.Mocked<MatIconRegistry>;
  let mockDomSanitizer: jest.Mocked<DomSanitizer>;
  let mockThemeService: jest.Mocked<ThemeService>;
  let routerEventsSubject: Subject<unknown>;

  const mockUser: User = {
    id: 'user-123',
    local: { username: 'testuser', isAdmin: false },
    facebook: {},
    twitter: {},
    google: {},
    history: {
      lastConnection: new Date(),
      downloadedBooks: [],
      ratings: [],
    },
  } as User;

  beforeEach(async () => {
    const userSubject = new Subject<User>();
    const filterSubject = new Subject<Filter>();
    const titleSubject = new Subject<Title>();
    routerEventsSubject = new Subject<unknown>();

    mockUserService = {
      checkAuthent: jest.fn(),
      userObservable: jest.fn(() => userSubject.asObservable()),
      isUserAdmin: jest.fn(() => false),
    } as any;

    mockFilterService = {
      currentFilterObservable: jest.fn(() => filterSubject.asObservable()),
      updateAllButNotDisplayed: jest.fn(),
    } as any;

    mockTitleService = {
      currentTitleObservable: jest.fn(() => titleSubject.asObservable()),
      goBack: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(() => Promise.resolve(true)),
      events: routerEventsSubject.asObservable(),
      config: [
        { path: 'home', data: { menu: true, label: 'Home' } },
        { path: 'admin', data: { menu: true, label: 'Admin', admin: true } },
        { redirectTo: 'home', path: '' },
      ],
    } as any;

    mockActivatedRoute = {
      snapshot: { firstChild: null, data: {} } as any,
    };

    mockTranslateService = {
      getBrowserLang: jest.fn(() => 'en'),
      use: jest.fn(),
      get: jest.fn(() => of('translated')),
    } as any;

    mockMatIconRegistry = {
      addSvgIcon: jest.fn().mockReturnThis(),
    } as any;

    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn((url) => url),
    } as any;

    mockThemeService = {
      mode: 'light',
      isDark: jest.fn(() => false),
      setMode: jest.fn(),
      toggle: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [TranslatePipe],
      providers: [
        provideTranslateService(),
        { provide: UserService, useValue: mockUserService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: TitleService, useValue: mockTitleService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MatIconRegistry, useValue: mockMatIconRegistry },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: ThemeService, useValue: mockThemeService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.links).toEqual([]);
    expect(component.filter).toBeInstanceOf(Filter);
    expect(component.title).toBeInstanceOf(Title);
    expect(component.hideHeader).toBe(false);
  });

  it('should fall back to English when no browser language is available', () => {
    (mockTranslateService.getBrowserLang as jest.Mock).mockReturnValue(undefined);

    const freshFixture = TestBed.createComponent(AppComponent);

    expect(freshFixture.componentInstance).toBeTruthy();
    expect(mockTranslateService.use).toHaveBeenCalledWith('en');
  });

  it('should use browser language if available', () => {
    expect(mockTranslateService.getBrowserLang).toHaveBeenCalled();
    expect(mockTranslateService.use).toHaveBeenCalledWith('en');
  });

  it('should register SVG icons for flags', () => {
    expect(mockMatIconRegistry.addSvgIcon).toHaveBeenCalledWith('flag_fr', expect.anything());
    expect(mockMatIconRegistry.addSvgIcon).toHaveBeenCalledWith('flag_us', expect.anything());
    expect(mockMatIconRegistry.addSvgIcon).toHaveBeenCalledWith('flag_fr_disabled', expect.anything());
    expect(mockMatIconRegistry.addSvgIcon).toHaveBeenCalledWith('flag_us_disabled', expect.anything());
  });

  describe('ngOnInit', () => {
    it('should check authentication on init', () => {
      component.ngOnInit();
      expect(mockUserService.checkAuthent).toHaveBeenCalled();
    });

    it('should subscribe to filter changes', () => {
      component.ngOnInit();
      expect(mockFilterService.currentFilterObservable).toHaveBeenCalled();
    });

    it('should subscribe to title changes', () => {
      component.ngOnInit();
      expect(mockTitleService.currentTitleObservable).toHaveBeenCalled();
    });

    it('should navigate to login when user is not authenticated', (done) => {
      const userSubject = new Subject<User>();
      mockUserService.userObservable = jest.fn(() => userSubject.asObservable());

      component.ngOnInit();

      // Emit undefined user
      userSubject.next(undefined as any);

      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 50);
    });

    it('should build menu links for regular user', (done) => {
      const userSubject = new Subject<User>();
      mockUserService.userObservable = jest.fn(() => userSubject.asObservable());
      mockUserService.isUserAdmin.mockReturnValue(false);

      component.ngOnInit();
      userSubject.next(mockUser);

      setTimeout(() => {
        const links = component.links;
        expect(links.length).toBeGreaterThan(0);
        expect(links.find((l) => l.label === 'Admin')).toBeUndefined();
        done();
      }, 50);
    });

    it('should include admin links for admin user', (done) => {
      const userSubject = new Subject<User>();
      mockUserService.userObservable = jest.fn(() => userSubject.asObservable());
      mockUserService.isUserAdmin.mockReturnValue(true);

      component.ngOnInit();
      userSubject.next(mockUser);

      setTimeout(() => {
        const links = component.links;
        expect(links.find((l) => l.label === 'Admin')).toBeDefined();
        done();
      }, 50);
    });

    it('should not hide the header when the resolved route has no hideHeader flag', () => {
      mockActivatedRoute.snapshot = { firstChild: null, data: {} } as any;
      component.ngOnInit();

      routerEventsSubject.next(new NavigationEnd(1, '/books', '/books'));

      expect(component.hideHeader).toBe(false);
    });

    it('should hide the header when the deepest resolved route has hideHeader: true', () => {
      mockActivatedRoute.snapshot = {
        firstChild: { firstChild: null, data: { hideHeader: true } },
        data: {},
      } as any;
      component.ngOnInit();

      routerEventsSubject.next(new NavigationEnd(1, '/login', '/login'));

      expect(component.hideHeader).toBe(true);
    });

    it('should ignore non-NavigationEnd router events for hideHeader', () => {
      mockActivatedRoute.snapshot = { firstChild: null, data: { hideHeader: true } } as any;
      component.ngOnInit();

      routerEventsSubject.next({});

      expect(component.hideHeader).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should call titleService goBack', () => {
      component.goBack();
      expect(mockTitleService.goBack).toHaveBeenCalled();
    });

    it('should reset the filter (keeping not_displayed) when a nav item is clicked', () => {
      component.onNavItemClick();
      expect(mockFilterService.updateAllButNotDisplayed).toHaveBeenCalledWith(expect.any(Filter));
    });
  });

  describe('Theme', () => {
    it('should delegate toggleTheme to the ThemeService', () => {
      component.toggleTheme();
      expect(mockThemeService.toggle).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnInit();

      const unsubscribeSpy = jest.fn();
      component['_currentUserSubscription'] = { unsubscribe: unsubscribeSpy } as any;
      component['_currentFilterSubscription'] = { unsubscribe: unsubscribeSpy } as any;
      component['_currentTitleSubscription'] = { unsubscribe: unsubscribeSpy } as any;
      component['_routerEventsSubscription'] = { unsubscribe: unsubscribeSpy } as any;

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalledTimes(4);
    });
  });
});
