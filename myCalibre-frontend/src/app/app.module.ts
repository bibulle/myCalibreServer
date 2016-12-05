import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app/app.component';
import { MdPeekabooModule } from './directives/peekaboo.directive';

import { HomeModule } from "./components/home/home.module";
import { AppRoutingModule } from "./app-routing.module";
import { MdContentModule } from "./components/content/content.component";
import { FooterComponent } from './components/footer/footer.component';
import { Media } from "./core/util/media";
import { ViewportHelper, BrowserViewportHelper } from "./core/util/viewport";
import { SubheaderComponent } from './components/subheader/subheader.component';
import { NotFoundModule } from "./components/not-found/not-found.module";
import { MdInk } from './directives/link.directive';
import { BookModule } from "./components/book/book.module";
import { FilterBarModule } from './components/filter-bar/filter-bar.component';
import { SeriesModule } from "./components/series/series.module";
import { TitleService } from "./app/title.service";
import { MaterialModule } from "@angular/material";

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    SubheaderComponent,
    MdInk,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,

    MaterialModule.forRoot(),

    MdContentModule,
    MdPeekabooModule,
    AppRoutingModule,
    HomeModule,
    NotFoundModule,
    BookModule,
    SeriesModule,
    FilterBarModule
  ],
  providers: [
    Media,
    TitleService,
    { provide: ViewportHelper, useClass: BrowserViewportHelper }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
