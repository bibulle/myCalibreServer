import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, Input } from '@angular/core';
import { Router, NavigationStart } from "@angular/router";
import { Media } from "../core/util/media";
import { FilterService, Filter } from "../components/filter-bar/filter.service";
import { TitleService, Title, Version } from "./title.service";
import { Location } from "@angular/common";
import { MdSidenav } from "@angular/material";
import { Subscription } from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

  static SIDE_MENU_BREAKPOINT: string = 'gt-md';

  @ViewChild(MdSidenav) private menu: MdSidenav;

  @Input() fullPage: boolean = this.media.hasMedia(AppComponent.SIDE_MENU_BREAKPOINT);

  version: Version = new Version({});
  links: {path: string, label: string}[] = [];


  filter = new Filter();
  title = new Title();

  previousUrls = [];

  private _mediaSubscription: Subscription = null;
  private _currentFilterSubscription: Subscription;
  private _currentTitleSubscription: Subscription;
  private _currentRouterEventSubscription: Subscription;

  constructor (private router: Router,
               private media: Media,
               private _filterService: FilterService,
               private _titleService: TitleService,
               private _location: Location,
               private _router: Router) {
  }

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit (): any {
    let query = Media.getQuery(AppComponent.SIDE_MENU_BREAKPOINT);
    this._mediaSubscription = this.media.listen(query).onMatched.subscribe((mql: MediaQueryList) => {
      setTimeout(() => {
        this.menu.mode = mql.matches ? 'side' : 'over';
        this.menu.toggle(mql.matches).catch(() => undefined);
      })
    });
  }

  /**
   * Is the sidenav menu pushed
   * @returns {MdSidenav|boolean}
   */
  get pushed (): boolean {
    return this.menu && this.menu.mode === 'side';
  }

  /**
   * Is the sidenav menu opened
   * @returns {MdSidenav|boolean}
   */
  get over (): boolean {
    return this.menu && this.menu.mode === 'over' && this.menu.opened;
  }

  // TODO(jd): these two property hacks are to work around issues with the peekaboo fixed nav
  // overlapping the sidenav and toolbar.  They will not properly "fix" to the top if inside
  // md-sidenav-layout, and they will overlap the sidenav and scrollbar when outside.  So just
  // calculate left and right properties for fixed toolbars based on the media query and browser
  // scrollbar width.  :sob: :rage:
  @Input()
  get sidenavWidth (): number {
    return this.pushed ? 181 : 0;
  }


  private _scrollWidth: number = -1;

  @Input()
  get scrollWidth (): number {
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
      if (w1 == w2) w2 = outer.clientWidth;

      document.body.removeChild(outer);

      this._scrollWidth = (w1 - w2);
    }
    return this._scrollWidth;
  };

  ngOnInit () {
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

    this.router.config.forEach(obj => {
      if (!obj.redirectTo && obj.data && obj.data['menu']) {
        this.links.push({path: obj.path, label: obj.data['label']});
      }
    });

    this._currentRouterEventSubscription = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        this.previousUrls.unshift(event['url']);
        // limit to 10 (2 should be enough ;-) )
        this.previousUrls = this.previousUrls.slice(0, 10);
      }
    })
  }


  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy (): any {
    if (this._mediaSubscription) {
      this._mediaSubscription.unsubscribe();
    }

    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
    if (this._currentTitleSubscription) {
      this._currentTitleSubscription.unsubscribe();
    }
    if (this._currentRouterEventSubscription) {
      this._currentRouterEventSubscription.unsubscribe();
    }

  }


  //noinspection JSUnusedGlobalSymbols
  getPrimaryLabel () {
    if (this.pushed) {
      return this.title.title;
    } else {
      return this.title.full_title;
    }
  }

  //noinspection JSUnusedGlobalSymbols
  getSecondaryLabel () {
    return this.title.main_title;
  }

  goBack () {
    if (this.previousUrls[1]) {
      this._location.back();
    } else {
      this._router.navigate([this.title.backUrl])
    }
  }

  itemClicked() {
    this.menu.opened=(this.menu.mode === 'side');
    this._filterService.update(new Filter());
  }

}
