import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Tag } from '@my-calibre-server/api-interfaces';

@Injectable()
export class TagService {
  constructor(private httpClient: HttpClient) {}

  /**
   * get the tag list
   */
  getTags(): Promise<Tag[]> {
    return new Promise<Tag[]>((resolve, reject) => {
      this.httpClient
        .get<ApiReturn>('/api/tags')
        // .map((res: Response) => res.json().data as Tag[])
        .subscribe({
          next: (data: ApiReturn) => {
            if (data && data.tags) {
              resolve(data.tags.map(tag => {
                tag.books.forEach(book => {
                  if (typeof book.book_date === 'string') {
                    book.book_date = new Date(book.book_date);
                  }
                });
                return tag;
              }));
            } else {
              console.error(data);
              reject('Cannot read tags');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }
}
