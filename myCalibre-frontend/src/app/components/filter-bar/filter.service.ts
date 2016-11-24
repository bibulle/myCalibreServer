import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class FilterService {

  private currentFilterSubject: BehaviorSubject<Filter>;

  constructor () {

    this.currentFilterSubject = new BehaviorSubject<Filter>(new Filter());


  }

  update (filter: Filter) {

    this.currentFilterSubject.next(filter);
  }

  /**
   * Subscribe to know if current course changes
   */
  currentFilterObservable (): Observable<Filter> {
    return this.currentFilterSubject;
  }


}

export class Filter {
  sort = SortType.Name;
  sorting_direction = SortingDirection.Asc;
  search = "";

  constructor () {
  };

}

export enum SortType {
  Name, PublishDate, Author
}
export enum SortingDirection {
  Asc, Desc
}
