import { Author, Book, Series, Tag } from './book';
import { UserAPI } from './user';
import { Version } from './version';

/**
 * API content
 */
export class ApiReturn {
  ok?: string;
  id_token?: string;
  version?: Version;
  user?: UserAPI;
  users?: UserAPI[];
  books?: Book[];
  tags?: Tag[];
  series?: Series[];
  authors?: Author[];
  book?: Book;
  refreshToken?: string;
  newPassword?: string;
  status?: Status;
}

export class Title {
  public static TITLE = 'title';

  full_title = '';
  title: string | undefined = '';
  main_title = Title.TITLE;
  backUrl: string | undefined;
  id: number | undefined;
  url: string | undefined;
  book_title: boolean;

  constructor(label = 'Home', backUrl?: string | undefined, id?: number | undefined, url?: string | undefined) {
    this.setTitle(label);
    this.backUrl = backUrl;
    this.id = id;
    this.url = url;
    this.book_title = false;
  }

  setTitle(label: string | undefined) {
    this.title = label !== 'Home' ? label : Title.TITLE;
    this.full_title = label !== 'Home' ? Title.TITLE + ' - ' + label : Title.TITLE;
  }
}

export class Status {
  calibreStatus = 'OK';
  cacheStatus = 'OK';
  calibreDate?: Date;
  calibreSize = 0;
  cacheAuthor?: Date;
  cacheBooks?: Date;
  cacheNewBooks?: Date;
  cacheSeries?: Date;
  cacheTags?: Date;
}
