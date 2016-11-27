import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app/app.component';
import { MdPeekabooModule } from './directives/peekaboo.directive';

import { MdToolbarModule } from "@angular2-material/toolbar";
import { MdListModule } from "@angular2-material/list";
import { MdSidenavModule } from "@angular2-material/sidenav";
import { HomeModule } from "./components/home/home.module";
import { AppRoutingModule } from "./app-routing.module";
import { MdContentModule } from "./components/content/content.component";
import { FooterComponent } from './components/footer/footer.component';
import { Media } from "./core/util/media";
import { ViewportHelper, BrowserViewportHelper } from "./core/util/viewport";
import { SubheaderComponent } from './components/subheader/subheader.component';
import { MdIconModule } from "@angular2-material/icon";
import { MdCoreModule, MdRippleModule } from "@angular2-material/core";
import { MdButtonModule } from "@angular2-material/button";
import { MdCardModule } from "@angular2-material/card";
import { NotFoundModule } from "./components/not-found/not-found.module";
import { MdInk } from './directives/link.directive';
import { BookListComponent } from './components/book/book-list/book-list.component';
import { BookModule } from "./components/book/book.module";
import { MdInputModule } from "@angular2-material/input";
import { FilterBarComponent, FilterBarModule } from './components/filter-bar/filter-bar.component';
import { SeriesListComponent } from './components/series/series-list/series-list.component';
import { SeriesModule } from "./components/series/series.module";

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

    MdCoreModule,
    MdButtonModule,
    MdIconModule.forRoot(),
    MdCardModule,
    MdInputModule,
    MdPeekabooModule,
    MdToolbarModule,
    MdListModule,
    MdSidenavModule,
    MdContentModule,
    MdRippleModule,

    AppRoutingModule,
    HomeModule,
    NotFoundModule,
    BookModule,
    SeriesModule,
    FilterBarModule
  ],
  providers: [
    Media,
    {provide: ViewportHelper, useClass: BrowserViewportHelper}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
