import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeriesService } from './series.service';
import { SeriesListComponent, SeriesListModule } from './series-list/series-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    SeriesListModule,
    MatCardModule,
    MatIconModule
  ],
  providers: [
    SeriesService
  ],
  exports: [
    SeriesListComponent
  ],
  declarations: [

  ]
})
export class SeriesModule { }
