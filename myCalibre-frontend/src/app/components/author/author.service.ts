import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Http, Response } from "@angular/http";
import { Author } from "./author";

@Injectable()
export class AuthorService {

  private authorUrl = environment.serverUrl + 'api/author';

  constructor (private http: Http) { }


  /**
   * get the author list
   */
  getAuthors (): Promise<Author[]> {

    return new Promise<Author[]>((resolve, reject) => {
      this.http.get(this.authorUrl)
          .map((res: Response) => res.json().data as Author[])
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
