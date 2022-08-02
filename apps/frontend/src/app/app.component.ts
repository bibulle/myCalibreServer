import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Title, User, Version } from '@my-calibre-server/api-interfaces';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { TitleService } from './app/title.service';
import { UserService } from './components/authent/user.service';
import { Filter, FilterService } from './components/filter-bar/filter.service';

@Component({
  selector: 'my-calibre-server-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {

  static SIDE_MENU_BREAKPOINT = '(min-width: 1280px)';

  @ViewChild(MatSidenav, {static: true}) private menu: MatSidenav|null = null;

  @Input() fullPage: boolean = this._breakpointObserver.isMatched(AppComponent.SIDE_MENU_BREAKPOINT);

  version: Version = new Version();
  links: { path: string|undefined, label: string }[] = [];

  user: User | undefined;
  filter = new Filter();
  title = new Title();

  private _mediaSubscription: Subscription | undefined;
  private _currentUserSubscription: Subscription | undefined;
  private _currentFilterSubscription: Subscription | undefined;
  private _currentTitleSubscription: Subscription | undefined;

  private _scrollWidth = -1;

  constructor(
              private _userService: UserService,
              private _filterService: FilterService,
              private _titleService: TitleService,
              private _router: Router,
              private _cdRef: ChangeDetectorRef,
              private _translate: TranslateService,
              private _matIconRegistry: MatIconRegistry,
              private _domSanitizer: DomSanitizer,
              public _breakpointObserver: BreakpointObserver) {
    this._translate.setDefaultLang('en');

    console.log(this._translate.getBrowserLang());
    if (this._translate.getBrowserLang()) {
      this._translate.use(this._translate.getBrowserLang() as string);
    }

    this._matIconRegistry
      .addSvgIcon('flag_fr', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/fr.svg'))
      .addSvgIcon('flag_us', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/us.svg'))
      .addSvgIcon('flag_fr_disabled', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/fr_disabled.svg'))
      .addSvgIcon('flag_us_disabled', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/us_disabled.svg'))
  }

  ngAfterViewChecked() {
    this._cdRef.detectChanges();
  }

  /**
   * Is the sidenav menu pushed
   * @returns {MatSidenav|boolean}
   */
  get pushed(): boolean {
    return this.menu != null && this.menu.mode === 'side';
  }

  /**
   * Is the sidenav menu opened
   * @returns {MatSidenav|null|boolean}
   */
  get over(): boolean {
    return this.menu != null && this.menu.mode === 'over' && this.menu.opened;
  }

  // TODO(jd): these two property hacks are to work around issues with the peekaboo fixed nav
  // overlapping the sidenav and toolbar.  They will not properly "fix" to the top if inside
  // mat-sidenav-layout, and they will overlap the sidenav and scrollbar when outside.  So just
  // calculate left and right properties for fixed toolbars based on the media query and browser
  // scrollbar width.  :sob: :rage:
  @Input()
  get sidenavWidth(): number {
    return this.pushed ? 181 : 0;
  }


  @Input()
  get scrollWidth(): number {
    if (this._scrollWidth === -1) {
      const inner = document.createElement('p');
      inner.style.width = '100%';
      inner.style.height = '200px';

      const outer = document.createElement('div');
      outer.style.position = 'absolute';
      outer.style.top = '0px';
      outer.style.left = '0px';
      outer.style.visibility = 'hidden';
      outer.style.width = '200px';
      outer.style.height = '150px';
      outer.style.overflow = 'hidden';
      outer.appendChild(inner);

      document.body.appendChild(outer);
      const w1 = inner.offsetWidth;
      outer.style.overflow = 'scroll';
      let w2 = inner.offsetWidth;
      if (w1 === w2) {
        w2 = outer.clientWidth;
      }

      document.body.removeChild(outer);

      this._scrollWidth = (w1 - w2);
    }
    return this._scrollWidth;
  };

  ngOnInit() {
    this._titleService.getVersion()
      .then(v => {
        this.version = v;
      });

    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe(
      filter => {
        this.filter = filter;
      }
    );

    this._currentTitleSubscription = this._titleService.currentTitleObservable().subscribe(
      title => {
        this.title = title;
      }
    );

    this._userService.checkAuthent();
    this._currentUserSubscription = this._userService.userObservable().subscribe(
      user => {
        if (!user || !user.id) {
          this._router.navigate(['/login']).catch()
        }
        this.user = user;

        const isAdmin = this._userService.isUserAdmin();
        const newLinks: { path: string|undefined, label: string }[] = [];

        this._router.config.forEach(obj => {
          if (!obj.redirectTo && obj.data && obj.data['menu']) {
            if (obj.data['admin'] && !isAdmin) {
              return;
            }
            newLinks.push({path: obj.path, label: obj.data['label']});
          }
        });
        this.links = newLinks;
      });

    this._breakpointObserver
      .observe([AppComponent.SIDE_MENU_BREAKPOINT])
      .subscribe((state: BreakpointState) => {
        if (this.menu) {
          this.menu.mode = state.matches ? 'side' : 'over';
          this.menu.toggle(state.matches).catch(() => undefined);
          }
      });

  }


  ngOnDestroy() {
    if (this._mediaSubscription) {
      this._mediaSubscription.unsubscribe();
    }
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
    if (this._currentTitleSubscription) {
      this._currentTitleSubscription.unsubscribe();
    }
    if (this._currentUserSubscription) {
      this._currentUserSubscription.unsubscribe();
    }
  }


  getPrimaryLabel() {
    if (this.pushed) {
      return this.title.title;
    } else {
      return this.title.full_title;
    }
  }

  getSecondaryLabel() {
    return this.title.main_title;
  }

  goBack() {
    this._titleService.goBack();
  }

  itemClicked() {
    if (!this.menu) {
      return
    }
    this.menu.opened = (this.menu.mode === 'side');
    this._filterService.updateAllButNotDisplayed(new Filter());
  }

  isVersionBeta(): boolean {
    return this.version.version.startsWith('0.');
  }

}
