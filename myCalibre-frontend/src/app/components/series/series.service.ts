import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Series } from './series';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class SeriesService {

  private seriesUrl = environment.serverUrl + 'api/series';

  constructor (private httpClient: HttpClient) { }


  /**
   * get the books list
   */
  getSeries (): Promise<Series[]> {

    return new Promise<Series[]>((resolve, reject) => {
      this.httpClient.get(this.seriesUrl)
          // .map((res: Response) => res.json().data as Series[])
          .subscribe(
            (data: Object) => {
              resolve(data['data'] as Series[]);
            },
            err => {
              reject(err);
            },
          );
    });
  }
}
