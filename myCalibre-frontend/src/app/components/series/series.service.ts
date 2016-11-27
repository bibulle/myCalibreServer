import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Http, Response } from "@angular/http";
import { Series } from "./series";

@Injectable()
export class SeriesService {

  private seriesUrl = environment.serverUrl + 'api/series';

  constructor (private http: Http) { }


  /**
   * get the books list
   */
  getSeries (): Promise<Series[]> {

    return new Promise<Series[]>((resolve, reject) => {
      this.http.get(this.seriesUrl)
          .map((res: Response) => res.json().data as Series[])
          .subscribe(
            data => {
              resolve(data);
            },
            err => {
              reject(err);
            },
          );
    });
  }
}
