import { Component, OnInit, NgModule, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatContentModule } from '../../content/content.component';
import { Filter, FilterService, SortType, SortingDirection, LangAvailable } from '../../filter-bar/filter.service';
import { AuthorService } from '../author.service';
import { AuthorCardModule } from '../author-card/author-card.component';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { Author } from '@my-calibre-server/api-interfaces';

@Component({
  selector: 'my-calibre-server-author-list',
  templateUrl: './author-list.component.html',
  styleUrls: ['./author-list.component.scss'],
})
export class AuthorListComponent implements OnInit, AfterViewInit, OnDestroy {
  MAX_AUTHORS = 100;
  param = {
    max: this.MAX_AUTHORS,
    totalCount: this.MAX_AUTHORS,
  };

  authors: Author[] = [];
  fullAuthors: Author[] = [];

  selectedId?: number;

  totalAuthorsCount = 0;

  filter: Filter = new Filter();
  private previousFilterJson = '';
  filterCount = 0;

  private _currentFilterSubscription?: Subscription;

  static _cleanAccent(str: string): string {
    return str
      .toLowerCase()
      .replace(/[àâªáäãåā]/g, 'a')
      .replace(/[èéêëęėē]/g, 'e')
      .replace(/[iïìíįī]/g, 'i')
      .replace(/[ôºöòóõøō]/g, 'o')
      .replace(/[ûùüúū]/g, 'u')
      .replace(/[æ]/g, 'ae')
      .replace(/[œ]/g, 'oe');
  }

  constructor(private _authorService: AuthorService, private _filterService: FilterService, private route: ActivatedRoute) {}

  //noinspection JSUnusedGlobalSymbols
  ngOnInit() {
    // Search for params (search)
    this.route.queryParams.forEach((params: Params) => {
      if (params['id']) {
        this.selectedId = params['id'];
      }
      if (params['name']) {
        this._filterService.updateSearch(params['name']);
      }
    });

    this._filterService.updateNotDisplayed(false);
    this._filterService.updateLimitTo([SortType.Name, SortType.PublishDate]);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe((filter: Filter) => {
      // console.log(filter);
      this.filter = filter;
      if (this.fullAuthors) {
        this._fillAuthors();
      }
    });

    this._authorService
      .getAuthors()
      .then((authors) => {
        this.fullAuthors = authors;
        this._fillAuthors();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit() {
    // if it's only an author, scroll to top
    if (this.selectedId) {
      setTimeout(() => {
        const element = document?.querySelector('#scrollView')?.parentElement;
        if (element) {
          element.scrollTop = 0;
        }
      });
    }
  }

  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy() {
    // console.log("ngOnDestroy");
    if (this._currentFilterSubscription) {
      this._currentFilterSubscription.unsubscribe();
    }
  }

  /**
   * fill the this.authors list (slowly) with the filtered this.fullAuthors list
   * @private
   */
  private _fillAuthors() {
    if (!this.fullAuthors || !this.filter) {
      return;
    }
    const _filterCount = ++this.filterCount;

    const tmpAuthors = this._filterAndSortAuthors();

    if (tmpAuthors) {
      let cpt = 0;
      const STEP = 5;

      // if authors list exists already, start from authors length
      if (this.authors) {
        cpt = Math.min(Math.ceil(this.authors.length / STEP), Math.floor(tmpAuthors.length / STEP)) + 1;
      }
      const initCpt = cpt;

      while (cpt * STEP <= tmpAuthors.length + STEP) {
        const _cpt = cpt + 1;
        setTimeout(() => {
          if (_filterCount === this.filterCount) {
            this.authors = tmpAuthors.filter((b, i) => {
              return i < _cpt * STEP;
            });
          }
        }, 100 * (cpt - initCpt));

        cpt++;
      }
    }
  }

  /**
   * Filter and sort the this.fullAuthors list with the this.filter
   * @returns {Author[]} or null is nothing to do
   * @private
   */
  _filterAndSortAuthors(): Author[] | null {
    const filterJson = JSON.stringify(this.filter);
    if (this.previousFilterJson === filterJson && this.authors != null && this.authors.length === this.fullAuthors.length) {
      return [];
    }
    this.previousFilterJson = filterJson;

    // first filter
    const filteredAuthors = this.fullAuthors
      // filter on text
      .filter((a: Author) => {
        const strToSearch = a.author_name + ' ' + a.author_sort;

        return AuthorListComponent._cleanAccent(strToSearch).includes(AuthorListComponent._cleanAccent(this.filter.search.trim()));
      })
      // filter on language
      .filter((a: Author) => {
        if (!a['allBooks']) {
          a['allBooks'] = a.books;
        }

        a.books = a['allBooks'].filter((b) => {
          return b.lang_code === LangAvailable[this.filter.lang].toLowerCase() || this.filter.lang === LangAvailable.All;
        });

        return a.books.length !== 0;
      })
      .sort((b1: Author, b2: Author) => {
        // console.log(b1);
        // console.log(b2);

        let v1: string;
        let v2: string;
        v1 = b1.author_sort ? b1.author_sort : b1.author_name;
        v2 = b2.author_sort ? b2.author_sort : b2.author_name;
        switch (this.filter.sort) {
          case SortType.Author:
          default:
            break;
          case SortType.PublishDate: {
            const v1Lst = b1.book_date.concat();
            const v2Lst = b2.book_date.concat();
            if (this.filter.sorting_direction === SortingDirection.Desc) {
              v1Lst.reverse();
              v2Lst.reverse();
            }
            v1 = v1Lst.toString() + ' ' + v1;
            v2 = v2Lst.toString() + ' ' + v2;
            break;
          }
        }

        switch (this.filter.sorting_direction) {
          case SortingDirection.Asc:
            return v1.localeCompare(v2);
          case SortingDirection.Desc:
          default:
            return v2.localeCompare(v1);
        }
      });

    this.totalAuthorsCount = filteredAuthors.length;
    this.param.totalCount = this.totalAuthorsCount;

    // then limit size
    return filteredAuthors.filter((b, i) => {
      return i < this.MAX_AUTHORS;
    });
  }
}

@NgModule({
  imports: [CommonModule, MatProgressSpinnerModule, MatContentModule, AuthorCardModule, TranslateModule],
  declarations: [AuthorListComponent],
  exports: [AuthorListComponent],
})
export class AuthorListModule {}
