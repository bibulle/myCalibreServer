import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Author } from './author';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class AuthorService {

  private authorUrl = environment.serverUrl + 'api/author';

  constructor (private httpClient: HttpClient) { }


  /**
   * get the author list
   */
  getAuthors (): Promise<Author[]> {

    return new Promise<Author[]>((resolve, reject) => {
      this.httpClient.get(this.authorUrl)
          // .map((res: Response) => res.json().data as Author[])
          .subscribe(
            (data: Object) => {
              resolve(data['data'] as Author[]);
            },
            err => {
              reject(err);
            },
          );
    });
  }
}
