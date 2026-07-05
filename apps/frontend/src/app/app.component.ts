import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Title, User, Version } from '@my-calibre-server/api-interfaces';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TitleService } from './app/title.service';
import { UserService } from './components/authent/user.service';
import { Filter, FilterService } from './components/filter-bar/filter.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
    selector: 'my-calibre-server-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {

  version: Version = new Version();
  links: { path: string|undefined, label: string }[] = [];

  user: User | undefined;
  filter = new Filter();
  title = new Title();
  hideHeader = false;

  private _currentUserSubscription: Subscription | undefined;
  private _currentFilterSubscription: Subscription | undefined;
  private _currentTitleSubscription: Subscription | undefined;
  private _routerEventsSubscription: Subscription | undefined;

  constructor(
              private _userService: UserService,
              private _filterService: FilterService,
              private _titleService: TitleService,
              private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _translate: TranslateService,
              private _matIconRegistry: MatIconRegistry,
              private _domSanitizer: DomSanitizer,
              public themeService: ThemeService) {
    // ngx-translate 18 removed setDefaultLang/getDefaultLang; use the browser
    // language if available, falling back to 'en' otherwise (same behavior
    // as the old setDefaultLang('en') + conditional use(browserLang)).
    this._translate.use(this._translate.getBrowserLang() ?? 'en');

    this._matIconRegistry
      .addSvgIcon('flag_fr', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/fr.svg'))
      .addSvgIcon('flag_us', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/us.svg'))
      .addSvgIcon('flag_fr_disabled', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/fr_disabled.svg'))
      .addSvgIcon('flag_us_disabled', this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/flags/4x3/us_disabled.svg'))
  }

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

    this._routerEventsSubscription = this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = this._activatedRoute.snapshot;
        while (route.firstChild) {
          route = route.firstChild;
        }
        this.hideHeader = route.data['hideHeader'] === true;
      });
  }


  ngOnDestroy() {
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
    if (this._currentTitleSubscription) {
      this._currentTitleSubscription.unsubscribe();
    }
    if (this._currentUserSubscription) {
      this._currentUserSubscription.unsubscribe();
    }
    if (this._routerEventsSubscription) {
      this._routerEventsSubscription.unsubscribe();
    }
  }

  goBack() {
    this._titleService.goBack();
  }

  /**
   * Reset the search/sort/lang filter whenever the user navigates to a new
   * section from the nav tabs, so a leftover search term doesn't leak in.
   */
  onNavItemClick() {
    this._filterService.updateAllButNotDisplayed(new Filter());
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  isVersionBeta(): boolean {
    return this.version.version.startsWith('0.');
  }

}
