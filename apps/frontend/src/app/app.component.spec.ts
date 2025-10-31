import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { TitleService } from './app/title.service';
import { UserService } from './components/authent/user.service';
import { Filter, FilterService } from './components/filter-bar/filter.service';
import { Title, User, Version } from '@my-calibre-server/api-interfaces';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockUserService: jest.Mocked<UserService>;
  let mockFilterService: jest.Mocked<FilterService>;
  let mockTitleService: jest.Mocked<TitleService>;
  let mockRouter: jest.Mocked<Router>;
  let mockBreakpointObserver: jest.Mocked<BreakpointObserver>;
  let mockTranslateService: jest.Mocked<TranslateService>;
  let mockMatIconRegistry: jest.Mocked<MatIconRegistry>;
  let mockDomSanitizer: jest.Mocked<DomSanitizer>;
  let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>;

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

  const mockVersion = {
    version: '1.2.3',
    buildDate: new Date(),
    github_url: 'https://github.com/test',
    name: 'Test App',
    copyright: '2025',
  } as Version;

  beforeEach(async () => {
    const userSubject = new Subject<User>();
    const filterSubject = new Subject<Filter>();
    const titleSubject = new Subject<Title>();
    const breakpointSubject = new Subject<BreakpointState>();

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
      getVersion: jest.fn(() => Promise.resolve(mockVersion)),
      currentTitleObservable: jest.fn(() => titleSubject.asObservable()),
      goBack: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(() => Promise.resolve(true)),
      config: [
        { path: 'home', data: { menu: true, label: 'Home' } },
        { path: 'admin', data: { menu: true, label: 'Admin', admin: true } },
        { redirectTo: 'home', path: '' },
      ],
    } as any;

    mockBreakpointObserver = {
      observe: jest.fn(() => breakpointSubject.asObservable()),
      isMatched: jest.fn(() => true),
    } as any;

    mockTranslateService = {
      setDefaultLang: jest.fn(),
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

    mockChangeDetectorRef = {
      detectChanges: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: TitleService, useValue: mockTitleService },
        { provide: Router, useValue: mockRouter },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MatIconRegistry, useValue: mockMatIconRegistry },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
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
    expect(component.version).toBeDefined();
    expect(component.links).toEqual([]);
    expect(component.filter).toBeInstanceOf(Filter);
    expect(component.title).toBeInstanceOf(Title);
  });

  it('should set default language to English', () => {
    expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith('en');
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
    it('should fetch version on init', async () => {
      await component.ngOnInit();
      await fixture.whenStable();

      expect(mockTitleService.getVersion).toHaveBeenCalled();
      expect(component.version.version).toBe('1.2.3');
    });

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
  });

  describe('Responsive behavior', () => {
    it('should detect if menu is pushed (side mode)', () => {
      component['menu'] = { mode: 'side' } as MatSidenav;
      expect(component.pushed).toBe(true);
    });

    it('should detect if menu is not pushed (over mode)', () => {
      component['menu'] = { mode: 'over', opened: true } as MatSidenav;
      expect(component.pushed).toBe(false);
    });

    it('should detect if menu is over and opened', () => {
      component['menu'] = { mode: 'over', opened: true } as MatSidenav;
      expect(component.over).toBe(true);
    });

    it('should calculate sidenav width when pushed', () => {
      component['menu'] = { mode: 'side' } as MatSidenav;
      expect(component.sidenavWidth).toBe(181);
    });

    it('should calculate sidenav width as 0 when not pushed', () => {
      component['menu'] = { mode: 'over' } as MatSidenav;
      expect(component.sidenavWidth).toBe(0);
    });

    it('should calculate scroll width', () => {
      const scrollWidth = component.scrollWidth;
      expect(scrollWidth).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Label methods', () => {
    beforeEach(() => {
      component.title = {
        title: 'Page Title',
        full_title: 'Full Page Title',
        main_title: 'Main Title',
      } as Title;
    });

    it('should return title when menu is pushed', () => {
      component['menu'] = { mode: 'side' } as MatSidenav;
      expect(component.getPrimaryLabel()).toBe('Page Title');
    });

    it('should return full_title when menu is not pushed', () => {
      component['menu'] = { mode: 'over' } as MatSidenav;
      expect(component.getPrimaryLabel()).toBe('Full Page Title');
    });

    it('should return main_title as secondary label', () => {
      expect(component.getSecondaryLabel()).toBe('Main Title');
    });
  });

  describe('Navigation', () => {
    it('should call titleService goBack', () => {
      component.goBack();
      expect(mockTitleService.goBack).toHaveBeenCalled();
    });

    it('should handle item click with side menu', () => {
      const mockMenu = { mode: 'side', opened: true };
      component['menu'] = mockMenu as MatSidenav;
      component.itemClicked();

      expect(mockMenu.opened).toBe(true);
      expect(mockFilterService.updateAllButNotDisplayed).toHaveBeenCalled();
    });

    it('should handle item click without menu', () => {
      component['menu'] = null;
      expect(() => component.itemClicked()).not.toThrow();
    });
  });

  describe('Version methods', () => {
    it('should detect beta version (0.x.x)', () => {
      component.version = { version: '0.9.5' } as Version;
      expect(component.isVersionBeta()).toBe(true);
    });

    it('should detect non-beta version (1.x.x)', () => {
      component.version = { version: '1.0.0' } as Version;
      expect(component.isVersionBeta()).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnInit();

      const unsubscribeSpy = jest.fn();
      component['_currentUserSubscription'] = { unsubscribe: unsubscribeSpy } as any;
      component['_currentFilterSubscription'] = { unsubscribe: unsubscribeSpy } as any;
      component['_currentTitleSubscription'] = { unsubscribe: unsubscribeSpy } as any;

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('ngAfterViewChecked', () => {
    it('should trigger change detection', () => {
      // Call the method directly without rendering template
      component['_cdRef'] = mockChangeDetectorRef;
      component.ngAfterViewChecked();
      expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
    });
  });
});
