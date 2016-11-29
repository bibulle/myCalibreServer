import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, Input } from '@angular/core';
import { MdSidenav } from "@angular2-material/sidenav";
import { Http, Response } from "@angular/http";
import { Router } from "@angular/router";
import { Media } from "../core/util/media";
import { FilterService, Filter } from "../components/filter-bar/filter.service";
import { TitleService, Title } from "./title.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

  static SIDE_MENU_BREAKPOINT: string = 'gt-md';

  @ViewChild(MdSidenav) private menu: MdSidenav;

  @Input() fullPage: boolean = this.media.hasMedia(AppComponent.SIDE_MENU_BREAKPOINT);

  version: string;
  links: {path: string, label: string}[] = [];

  private _subscription = null;

  filter = new Filter();
  title = new Title();


  constructor (private http: Http,
               private router: Router,
               private media: Media,
               private _filterService: FilterService,
               private _titleService: TitleService) {}

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit (): any {
    let query = Media.getQuery(AppComponent.SIDE_MENU_BREAKPOINT);
    this._subscription = this.media.listen(query).onMatched.subscribe((mql: MediaQueryList) => {
      setTimeout(() => {
        this.menu.mode = mql.matches ? 'side' : 'over';
        this.menu.toggle(mql.matches).catch(() => undefined);
      })
    });
  }

  get pushed (): boolean { return this.menu && this.menu.mode === 'side'; }

  get over (): boolean { return this.menu && this.menu.mode === 'over' && this.menu.opened; }

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
      var inner = document.createElement('p');
      inner.style.width = '100%';
      inner.style.height = '200px';

      var outer = document.createElement('div');
      outer.style.position = 'absolute';
      outer.style.top = '0px';
      outer.style.left = '0px';
      outer.style.visibility = 'hidden';
      outer.style.width = '200px';
      outer.style.height = '150px';
      outer.style.overflow = 'hidden';
      outer.appendChild(inner);

      document.body.appendChild(outer);
      var w1 = inner.offsetWidth;
      outer.style.overflow = 'scroll';
      var w2 = inner.offsetWidth;
      if (w1 == w2) w2 = outer.clientWidth;

      document.body.removeChild(outer);

      this._scrollWidth = (w1 - w2);
    }
    return this._scrollWidth;
  };

  ngOnInit () {
    this.http.get('version.json').subscribe((res: Response) => {
      const json = res.json();
      this.version = json.version;
    });

    this._filterService.currentFilterObservable().subscribe(
      filter => {
        this.filter = filter;
      }
    );

    this._titleService.currentTitleObservable().subscribe(
      title => {
        this.title = title;
      }
    );

    this.router.config.forEach(obj => {
      if (!obj.redirectTo && obj.data && obj.data['menu']) {
        this.links.push({ path: obj.path, label: obj.data['label'] });
      }
    });
  }


  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy (): any { this._subscription.unsubscribe(); }


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
}
