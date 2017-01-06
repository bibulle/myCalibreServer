import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";
import { Router, RoutesRecognized } from "@angular/router";
import { Response, Http } from "@angular/http";

@Injectable()
export class TitleService {

  public static TITLE: string = 'Shared library';

  private currentTitleSubject: BehaviorSubject<Title>;

  constructor (private http: Http,
               private router: Router) {

    this.currentTitleSubject = new BehaviorSubject<Title>(new Title());

    this.router.events.subscribe((data) => {
      if (data instanceof RoutesRecognized) {
        const navigationLabel = data.state.root.firstChild.data['label'];
        this.update(navigationLabel);
      }
    });


  }

  update (label?: string, backUrl?: string) {
    this.currentTitleSubject.next(new Title(label, backUrl));
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
        this.http
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

  constructor (label = 'Home', backUrl: string = null) {
    this.title = (label != 'Home') ? label : TitleService.TITLE;
    this.full_title = (label != 'Home') ? TitleService.TITLE + ' - ' + label : TitleService.TITLE;

    this.backUrl = backUrl;
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
