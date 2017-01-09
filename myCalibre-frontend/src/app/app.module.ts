import { BrowserModule } from '@angular/platform-browser';
import { NgModule, enableProdMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from "@angular/material";
import { Options, Level, Logger } from "angular2-logger/core";

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from "./app-routing.module";
import { TitleService } from "./app/title.service";

import { MdPeekabooModule } from './directives/peekaboo.directive';
import { MdInk } from './directives/link.directive';
import { Media } from "./core/util/media";
import { ViewportHelper, BrowserViewportHelper } from "./core/util/viewport";
import { environment } from "../environments/environment";

import { MdContentModule } from "./components/content/content.component";
import { FooterComponent } from './components/footer/footer.component';
import { SubheaderComponent } from './components/subheader/subheader.component';
import { NotFoundModule } from "./components/not-found/not-found.module";
import { BookModule } from "./components/book/book.module";
import { FilterBarModule } from './components/filter-bar/filter-bar.component';
import { SeriesModule } from "./components/series/series.module";
import { AuthorModule } from "./components/author/author.module";
import { HomeModule } from "./components/home/home.component";
import { TagModule } from "./components/tag/tag.module";
import { LoginModule } from './components/login/login.component';

let loggerProviderOptions = { provide: Options, useValue: { level: Level.LOG } };
if (environment.production) {
  enableProdMode();
  loggerProviderOptions = { provide: Options, useValue: { level: Level.INFO } };
}

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
    AuthorModule,
    TagModule,
    FilterBarModule,
    LoginModule,
  ],
  providers: [
    Logger,
    loggerProviderOptions,
    Media,
    TitleService,
    { provide: ViewportHelper, useClass: BrowserViewportHelper }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
