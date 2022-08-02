import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { ApiReturn, Title, Version } from '@my-calibre-server/api-interfaces';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class TitleService {

  private currentTitleSubject: BehaviorSubject<Title>;

  private titles: Title[] = [];

  private _version: Version | undefined;

  constructor(private _http: HttpClient, private _router: Router, private _location: Location) {
    this.currentTitleSubject = new BehaviorSubject<Title>(new Title());

    this._router.events.subscribe((data) => {
      // console.log(data);
      if (data instanceof RoutesRecognized) {
        // Title has bee recognized, add it to history
        let backUrl: string | undefined;
        if (this.titles.length > 0) {
          backUrl = this.titles[0].url;
        }
        this.titles.unshift(new Title(data.state.root.firstChild?.data['label'], backUrl, data.id, data.url));
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
    if (this.titles.length > 1 && this.titles[0].backUrl) {
      const backUrl = this.titles[0].backUrl;
      this.titles = this.titles.slice(2);
      this._router.navigateByUrl(backUrl).catch();
    } else {
      this._location.back();
    }
  }

  /**
   * Force a book title
   * @param url
   * @param book_title
   */
  forceTitle(url: string | undefined, book_title: string | undefined) {
    if (this.titles[0].url === url) {
      this.titles[0].setTitle(book_title);
      this.titles[0].book_title = true;
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
  currentTitleObservable(): Observable<Title> {
    return this.currentTitleSubject;
  }

  /**
   * get the version values
   */
  getVersion(): Promise<Version> {
    return new Promise<Version>((resolve, reject) => {
      if (this._version) {
        resolve(this._version);
      } else {
        this._http.get<ApiReturn>('/api/version').subscribe({
          next: (data) => {
            // console.log(JSON.stringify(data,null,2))

            if (data && data.version) {
              this._version = data.version;
              resolve(this._version);
            } else {
              console.error(data);
              reject('Cannot get version');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
      }
    });
  }
}

