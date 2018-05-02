import {BookData} from '../book/book';

export class User {

  id: string;
  created: Date;
  updated: Date;

  local: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    isAdmin: boolean;
    amazonEmails: string[];
  };

  facebook: {
    email: string,
    name: string,
  };

  twitter: {
    displayName: string,
    username: string,
  };

  google: {
    email: string,
    name: string,
  };

  history: {
    lastConnection: Date,
    downloadedBooks: DownloadedBook[],
    ratings: BookRating[]
  };


  constructor(options) {

    if (options) {
      this.id = options.id;
      this.created = new Date(options.created);
      this.updated = new Date(options.updated);
    }
    if (options && options.local) {
      this.local = {
        username: options.local.username,
        firstname: options.local.firstname,
        lastname: options.local.lastname,
        email: options.local.email,
        isAdmin: options.local.isAdmin,
        amazonEmails: options.local.amazonEmails ? options.local.amazonEmails.filter(el => { return (el.trim().length > 0)}) : []
      }
    } else {
      this.local = {
        username: null,
        firstname: null,
        lastname: null,
        email: null,
        isAdmin: null,
        amazonEmails: []
      }
    }
    if (options && options.facebook) {
      this.facebook = {
        email: options.facebook.email,
        name: options.facebook.name
      }
    }
    if (options && options.twitter) {
      this.twitter = {
        displayName: options.twitter.displayName,
        username: options.twitter.username
      }
    }
    if (options && options.google) {
      this.google = {
        email: options.google.email,
        name: options.google.name
      }
    }
    if (options && options.history) {
      this.history = {
        lastConnection: options.history.lastConnection,
        downloadedBooks: options.history.downloadedBooks,
        ratings: options.history.ratings
      }
    }

  }

}

export class DownloadedBook {
  date: Date;
  id: number;
  data: BookData;
}
export class BookRating {
  date: Date;
  rating: number;
  // noinspection JSUnusedGlobalSymbols
  book_id: number;
}
