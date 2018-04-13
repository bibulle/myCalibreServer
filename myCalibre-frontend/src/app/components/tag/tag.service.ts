import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Tag } from './tag';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class TagService {

  private tagUrl = environment.serverUrl + 'api/tag';

  constructor (private httpClient: HttpClient) { }


  /**
   * get the tag list
   */
  getTags (): Promise<Tag[]> {

    return new Promise<Tag[]>((resolve, reject) => {
      this.httpClient.get(this.tagUrl)
          // .map((res: Response) => res.json().data as Tag[])
          .subscribe(
            (data: Object) => {
              resolve(data['data'] as Tag[]);
            },
            err => {
              reject(err);
            },
          );
    });
  }
}
