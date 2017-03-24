import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { AuthHttp } from "angular2-jwt";
import { Http, Response } from "@angular/http";
import { Author } from "./author";

@Injectable()
export class AuthorService {

  private authorUrl = environment.serverUrl + 'api/author';

  constructor (private authHttp: AuthHttp) { }


  /**
   * get the author list
   */
  getAuthors (): Promise<Author[]> {

    return new Promise<Author[]>((resolve, reject) => {
      this.authHttp.get(this.authorUrl)
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
