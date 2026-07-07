import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, NgModule, OnDestroy, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Book, Tag } from '@my-calibre-server/api-interfaces';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ImageSpritesModule } from '../../image-sprites/image-sprites.component';
import { Filter, FilterService, LangAvailable, SortingDirection, SortType } from '../../filter-bar/filter.service';
import { FilterBarModule } from '../../filter-bar/filter-bar.component';
import { TagCardModule } from '../tag-card/tag-card.component';
import { TagService } from '../tag.service';
import { NotificationService } from '../../notification/notification.service';

@Component({
  selector: 'my-calibre-server-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss'],
  standalone: false,
})
export class TagListComponent implements OnInit, OnDestroy, AfterViewInit {
  MAX_TAGS = 100;
  param = {
    max: this.MAX_TAGS,
    totalCount: this.MAX_TAGS,
  };

  tags: Tag[] = [];
  fullTags: Tag[] = [];

  selectedId?: number;

  totalTagsCount = 0;

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

  constructor(
    private _tagService: TagService,
    private _filterService: FilterService,
    private route: ActivatedRoute,
    private _notificationService: NotificationService,
    private _translateService: TranslateService,
    private _router: Router
  ) {}

  get tagSelected(): boolean {
    return !!this.selectedTag;
  }

  get selectedTag(): Tag | undefined {
    return this.tags.find((t) => t.tag_id === this.selectedId);
  }

  get selectedTagBooks(): Book[] {
    return this.selectedTag?.books ?? [];
  }

  get subtitle(): string {
    const selected = this.selectedTag;
    if (selected) {
      return this._translateService.instant('label.tags-subtitle-filtered', { name: selected.tag_name, count: selected.books.length });
    }
    return this._translateService.instant('label.tags-subtitle', { count: this.totalTagsCount });
  }

  get maxTagCount(): number {
    return Math.max(1, ...this.tags.map((t) => t.books.length));
  }

  tagWeight(tag: Tag): number {
    if (tag.tag_id === this.selectedId) {
      return 700;
    }
    return tag.books.length / this.maxTagCount > 0.5 ? 600 : 500;
  }

  tagFontSize(tag: Tag): string {
    const scale = tag.books.length / this.maxTagCount;
    return (12.5 + scale * 5).toFixed(1) + 'px';
  }

  selectTag(tag: Tag) {
    this.selectedId = this.selectedId === tag.tag_id ? undefined : tag.tag_id;
  }

  clearTagFilter() {
    this.selectedId = undefined;
    this._filterService.updateSearch('');
  }

  openBook(bookId: number) {
    this._router.navigate(['/book', bookId]);
  }

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
    this._filterService.updateLimitTo([SortType.Name, SortType.Count]);
    this._currentFilterSubscription = this._filterService.currentFilterObservable().subscribe((filter: Filter) => {
      // console.log(filter);
      this.filter = filter;
      if (this.fullTags) {
        this._fillTags();
      }
    });

    this._tagService
      .getTags()
      .then((tags) => {
        this.fullTags = tags;
        this._fillTags();
      })
      .catch((err) => {
        console.log(err);
        this._notificationService.error(err);
      });
  }

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit() {
    // if it's only a tag, scroll to top
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
   * fill the this.tags list (slowly) with the filtered this.fullTags list
   * @private
   */
  private _fillTags() {
    if (!this.fullTags || !this.filter) {
      return;
    }
    const _filterCount = ++this.filterCount;

    const tmpTags = this._filterAndSortTags();

    if (tmpTags) {
      let cpt = 0;
      const STEP = 5;

      // if tags list exists already, start from tags length
      if (this.tags) {
        cpt = Math.min(Math.ceil(this.tags.length / STEP), Math.floor(tmpTags.length / STEP)) + 1;
      }
      const initCpt = cpt;

      while (cpt * STEP <= tmpTags.length + STEP) {
        const _cpt = cpt + 1;
        setTimeout(() => {
          if (_filterCount === this.filterCount) {
            this.tags = tmpTags.filter((b, i) => {
              return i < _cpt * STEP;
            });
          }
        }, 100 * (cpt - initCpt));

        cpt++;
      }
    }
  }

  /**
   * Filter and sort the this.fullTags list with the this.filter
   * @returns {Tag[]} or null is nothing to do
   * @private
   */
  _filterAndSortTags(): Tag[] | null {
    const filterJson = JSON.stringify(this.filter);
    if (this.previousFilterJson === filterJson && this.tags != null && this.tags.length === this.fullTags.length) {
      return [];
    }
    this.previousFilterJson = filterJson;

    // first filter
    const filteredTags = this.fullTags
      // filter on text
      .filter((t: Tag) => {
        const strToSearch = t.tag_name;

        return TagListComponent._cleanAccent(strToSearch).includes(TagListComponent._cleanAccent(this.filter.search.trim()));
      })
      // filter on language
      .filter((t: Tag) => {
        if (!t.allBooks) {
          t.allBooks = t.books;
        }

        t.books = t.allBooks.filter((b) => {
          return b.lang_code === LangAvailable[this.filter.lang].toLowerCase() || this.filter.lang === LangAvailable.All;
        });

        return t.books.length !== 0;
      })
      .sort((b1: Tag, b2: Tag) => {
        if (this.filter.sort === SortType.Count) {
          const diff = b1.books.length - b2.books.length;
          return this.filter.sorting_direction === SortingDirection.Asc ? diff : -diff;
        }

        // console.log(b1);
        // console.log(b2);

        const v1 = b1.tag_name;
        const v2 = b2.tag_name;
        switch (this.filter.sort) {
          case SortType.Author:
          default:
            break;
        }

        switch (this.filter.sorting_direction) {
          case SortingDirection.Asc:
            return v1.localeCompare(v2);
          case SortingDirection.Desc:
          default:
            return v2.localeCompare(v1);
        }
      });

    this.totalTagsCount = filteredTags.length;
    this.param.totalCount = this.totalTagsCount;

    // then limit size
    return filteredTags.filter((b, i) => {
      return i < this.MAX_TAGS;
    });
  }
}

@NgModule({
  imports: [CommonModule, MatProgressSpinnerModule, TagCardModule, TranslatePipe, ImageSpritesModule, FilterBarModule],
  declarations: [TagListComponent],
  exports: [TagListComponent],
})
export class TagListModule {}
