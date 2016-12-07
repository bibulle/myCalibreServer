import { Component, OnInit, NgModule } from '@angular/core';
import { TagCardModule } from "../tag-card/tag-card.component";
import { MdContentModule } from "../../content/content.component";
import { MdProgressCircleModule } from "@angular/material";
import { CommonModule } from "@angular/common";
import { Tag } from "../tag";
import { Filter, SortType, FilterService, SortingDirection } from "../../filter-bar/filter.service";
import { TagService } from "../tag.service";
import { ActivatedRoute, Params } from "@angular/router";

@Component({
  selector: 'app-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss']
})
export class TagListComponent implements OnInit {

  MAX_TAGS = 100;

  tags: Tag[];
  fullTags: Tag[];

  selectedId: number;

  totalTagsCount = 0;

  filter: Filter = new Filter({ limit_to: [SortType.Name] });
  private previousFilterJson: string = "";
  filterCount = 0;

  constructor (private _tagService: TagService,
               private _filterService: FilterService,
               private route: ActivatedRoute) {

  }

  //noinspection JSUnusedGlobalSymbols
  ngOnInit () {

    // Search for params (search)
    this.route.params.forEach((params: Params) => {
      if (params['id']) {
        this.selectedId = params['id'];
      }
      if (params['name']) {
        this.filter.search = params['name'];
      }
    });


    this._filterService.update(this.filter);
    this._filterService.currentFilterObservable().subscribe(
      (filter: Filter) => {
        this.filter = filter;
        if (this.fullTags) {
          this._fillTags();
        }
      }
    );

    this._tagService
        .getTags()
        .then(tags => {
          this.fullTags = tags;
          this._fillTags();

        })
        .catch(err => {
          console.log(err);
        })
  }

  //noinspection JSUnusedGlobalSymbols
  ngAfterViewInit() {
    // if it's only a tag, scroll to top
    if (this.selectedId) {
      setTimeout(() => {
        document.querySelector('#scrollView').parentElement.scrollTop = 0;
      })
    }
  }

  /**
   * fill the this.tags list (slowly) with the filtered this.fullTags list
   * @private
   */
  private _fillTags () {
    const _filterCount = (++this.filterCount);

    const tmpTags = this._filterAndSortTags();

    if (tmpTags) {

      let cpt = 0;
      const STEP = 5;

      // if tags list exists already, start from tags length
      if (this.tags) {
        cpt = Math.min(
            Math.ceil(this.tags.length / STEP),
            Math.floor(tmpTags.length / STEP)) + 1;
      }
      const initCpt = cpt;

      while (cpt * STEP <= tmpTags.length + STEP) {
        const _cpt = cpt + 1;
        setTimeout(() => {
            if (_filterCount == this.filterCount) {
              this.tags = tmpTags.filter((b, i) => {
                return i < _cpt * STEP;
              });
            }
          },
          100 * (cpt - initCpt));

        cpt++;
      }
    }

  }

  /**
   * Filter and sort the this.fullTags list with the this.filter
   * @returns {Tag[]} or null is nothing to do
   * @private
   */
  _filterAndSortTags (): Tag[] {
    const filterJson = JSON.stringify(this.filter);
    if ((this.previousFilterJson === filterJson) && (this.tags != null)) {
      return null;
    }
    this.previousFilterJson = filterJson;

    // first filter
    const filteredTags = this.fullTags
                                .filter((t: Tag) => {

                                  const strToSearch = t.tag_name;

                                  return (TagListComponent._cleanAccent(strToSearch).includes(TagListComponent._cleanAccent(this.filter.search)));
                                })
                                .sort((b1: Tag, b2: Tag) => {
                                  // console.log(b1);
                                  // console.log(b2);

                                  let v1: string;
                                  let v2: string;
                                  v1 = b1.tag_name;
                                  v2 = b2.tag_name;
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

    // then limit size
    return filteredTags
      .filter((b, i) => {
        return i < this.MAX_TAGS;
      });
  }

  static _cleanAccent (str: string): string {
    return str.toLowerCase()
              .replace(/[àâªáäãåā]/g, "a")
              .replace(/[èéêëęėē]/g, "e")
              .replace(/[iïìíįī]/g, "i")
              .replace(/[ôºöòóõøō]/g, "o")
              .replace(/[ûùüúū]/g, "u")
              .replace(/[æ]/g, "ae")
              .replace(/[œ]/g, "oe");
  }


}

@NgModule({
  imports: [
    CommonModule,
    MdProgressCircleModule,
    MdContentModule,
    TagCardModule,
  ],
  declarations: [
    TagListComponent,
  ],
  exports: [
    TagListComponent
  ]
})
export class TagListModule {
}
