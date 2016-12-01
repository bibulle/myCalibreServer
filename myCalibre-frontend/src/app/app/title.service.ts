import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";
import { Router, RoutesRecognized } from "@angular/router";

@Injectable()
export class TitleService {

  public static TITLE: string = 'Shared library';

  private currentTitleSubject: BehaviorSubject<Title>;

  constructor (private router: Router) {

    this.currentTitleSubject = new BehaviorSubject<Title>(new Title());

    this.router.events.subscribe((data) => {
      if (data instanceof RoutesRecognized) {
        var navigationLabel = data.state.root.firstChild.data['label'];
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



}

export class Title {
  full_title: string;
  title: string;
  main_title = TitleService.TITLE;
  backUrl: string;

  constructor (label = 'Home', backUrl:string = null) {
    this.title = (label != 'Home') ? label : TitleService.TITLE;
    this.full_title = (label != 'Home') ? TitleService.TITLE + ' - ' + label : TitleService.TITLE;

    this.backUrl = backUrl;
  }

}

