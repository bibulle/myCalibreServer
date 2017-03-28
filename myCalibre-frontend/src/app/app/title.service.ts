import { Injectable } from '@angular/core';
import { Location } from "@angular/common";
import { Response, Http } from "@angular/http";
import {NavigationCancel, NavigationEnd, Router, RoutesRecognized} from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class TitleService {

  public static TITLE: string = 'Shared library';

  private currentTitleSubject: BehaviorSubject<Title>;

  private titles: Title[] = [];

  constructor (private _http: Http,
               private _router: Router,
               private _location: Location) {

    this.currentTitleSubject = new BehaviorSubject<Title>(new Title());

    this._router.events.subscribe((data) => {
      //console.log(data);
      if (data instanceof RoutesRecognized) {
        // Title has bee recognized, add it to history
        let backUrl: string = null;
        if (this.titles.length > 0) {
          backUrl = this.titles[0].url;
        }
        this.titles.unshift(new Title(data.state.root.firstChild.data['label'],backUrl, data.id, data.url));
        this.titles = this.titles.slice(0, 100);

      } else if (data instanceof NavigationCancel) {
        // Title has been canceled : remove from history
        this.titles = this.titles.slice(1);

      } else if (data instanceof NavigationEnd) {
        // Title has been done change title, ...
        this.update(this.titles[0]);

      }
    });


  }

  /**
   * Navigate one step back
   */
  goBack() {
    if ((this.titles.length > 1) && this.titles[0].backUrl) {
      const backUrl = this.titles[0].backUrl;
      this.titles = this.titles.slice(2);
      this._router.navigateByUrl(backUrl);
    } else {
      this._location.back();
    }
  }

  /**
   * Force a book title
   * @param url
   * @param book_title
   */
  forceTitle(url: string, book_title: string) {
    if (this.titles[0].url === url) {
      this.titles[0].setTitle(book_title);
    }
  }


  /**
   * Update title everywhere
   * @param title
   */
  update(title: Title) {
    this.currentTitleSubject.next(title);
  }

  /**
   * Subscribe to know if current course changes
   */
  currentTitleObservable (): Observable<Title> {
    return this.currentTitleSubject;
  }

  /**
   * get the version values
   */
  private _version: Version;

  getVersion (): Promise<Version> {
    return new Promise<Version>((resolve) => {
      if (this._version) {
        resolve(this._version);
      } else {
        this._http
            .get('version.json')
            .subscribe((res: Response) => {
              const json = res.json();
              this._version = new Version(json);
              resolve(this._version);
            });
      }

    });
  }


}

export class Title {
  full_title: string;
  title: string;
  main_title = TitleService.TITLE;
  backUrl: string;
  id: number;
  url: string;

  constructor (label = 'Home', backUrl: string = null, id: number = null, url: string = null) {
    this.setTitle(label);
    this.backUrl = backUrl;
    this.id = id;
    this.url = url;
  }

  setTitle(label: string) {
    this.title = (label != 'Home') ? label : TitleService.TITLE;
    this.full_title = (label != 'Home') ? TitleService.TITLE + ' - ' + label : TitleService.TITLE;
  }

}

export class Version {
  version: string;
  github_url: string;
  github_name: string;
  copyright: string;

  constructor (options: any) {
    this.version = options.version;
    this.github_url = options.github_url;
    this.github_name = options.github_name;
    this.copyright = options.copyright;
  }

  isBeta() {
    return (""+this.version).startsWith("0.");
  }

}
