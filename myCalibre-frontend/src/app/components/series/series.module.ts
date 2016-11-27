import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MdCardModule } from "@angular2-material/card";
import { MdIconModule } from "@angular2-material/icon";
import { SeriesService } from "./series.service";
import { SeriesListComponent, SeriesListModule } from "./series-list/series-list.component";
import { SeriesCardComponent } from './series-card/series-card.component';

@NgModule({
  imports: [
    CommonModule,
    SeriesListModule,
    MdCardModule,
    MdIconModule
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
