import { Component, OnInit, NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { Subject } from "rxjs";

import { FilterService, Filter, SortType, SortingDirection } from "./filter.service";
import { MdIconModule, MdInputModule, MdMenuModule } from "@angular/material";

@Component({
  selector: 'filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss']
})
export class FilterBarComponent implements OnInit {

  filter = new Filter();

  // The queue to manage user choices
  private subjectFilter: Subject<Filter>;


  constructor(private _filterService: FilterService) {

  }

  ngOnInit() {
    // Apply UI changes
    if (!this.subjectFilter) {
      this.subjectFilter = new Subject<Filter>();
      this.subjectFilter
          .debounceTime(500)
          .subscribe(
            filter => {
              this._filterService.update(filter);
            },
            error => {
              console.log(error);
            }
          );
    }

    this._filterService.currentFilterObservable().subscribe(
      filter => {
        this.filter = filter;
      }
    )
  }

  toggleSort(sortType: SortType) {
    if (this.filter.sort == sortType) {
      this.filter.sorting_direction = (this.filter.sorting_direction + 1) % 2;
    } else {
      this.filter.sort = sortType;
      this.filter.sorting_direction = SortingDirection.Asc;
    }
    this.filterList();
  }


  /**
   * Add an event to sort/filter
   */
  filterList() {
    this.subjectFilter.next(this.filter);
  }

}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdIconModule,
    MdInputModule,
    MdMenuModule.forRoot()
  ],
  declarations: [
    FilterBarComponent
  ],
  providers: [
    FilterService
  ],
  exports: [
    FilterBarComponent
  ]
})
export class FilterBarModule {
}