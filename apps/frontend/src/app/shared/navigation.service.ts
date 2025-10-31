import { Injectable } from '@angular/core';

export interface INavigationLink {
  /**
   * Brief description of no more than a few words
   */
  brief: string;
  /**
   * Value to bind to routeLink.
   */
  routeLink: string;
}

@Injectable()
export class NavigationService {
  public currentTitle: string | null = null;
  public nextLink: INavigationLink | null = null;
  public prevLink: INavigationLink | null = null;

  // componentLink(comp: IComponentMeta): INavigationLink {
  //   return {brief: comp.name, routeLink: '/components/' + comp.id};
  // }
}
