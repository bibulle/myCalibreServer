import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Http, Response } from "@angular/http";
import { Tag } from "./tag";

@Injectable()
export class TagService {

  private tagUrl = environment.serverUrl + 'api/tag';

  constructor (private http: Http) { }


  /**
   * get the tag list
   */
  getTags (): Promise<Tag[]> {

    return new Promise<Tag[]>((resolve, reject) => {
      this.http.get(this.tagUrl)
          .map((res: Response) => res.json().data as Tag[])
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
