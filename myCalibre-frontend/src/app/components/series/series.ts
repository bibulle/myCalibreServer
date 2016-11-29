
import { Book } from "../book/book";
export class Series {

  //noinspection JSUnusedGlobalSymbols
  series_id: number;
  series_name: string;
  //noinspection JSUnusedGlobalSymbols
  series_sort: string;

  author_name: string[];
  book_date: string[];

  books: Book[];

}