import { Component, OnInit } from '@angular/core';
import {Filter, FilterService} from '../filter-bar/filter.service';

@Component({
  selector: 'my-calibre-server-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {

  constructor(
    private _filterService: FilterService
    ) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));
  }

}
