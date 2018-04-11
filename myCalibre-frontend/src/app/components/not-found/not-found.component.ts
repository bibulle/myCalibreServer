import { Component, OnInit } from '@angular/core';
import {Filter, FilterService} from '../filter-bar/filter.service';

@Component({
  selector: 'not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {

  constructor(private _filterService: FilterService) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));
  }

}
