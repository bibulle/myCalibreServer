import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Http, HttpModule, RequestOptions} from '@angular/http';
import {MaterialModule} from './material.module';

import {AppComponent} from './app/app.component';
import {AppRoutingModule} from './app-routing.module';
import {TitleService} from './app/title.service';

import {MdPeekabooModule} from './directives/peekaboo.directive';
import {MatInkDirective} from './directives/link.directive';
import {Media} from './core/util/media';
import {BrowserViewportHelper, ViewportHelper} from './core/util/viewport';

import {MatContentModule} from './components/content/content.component';
import {FooterComponent} from './components/footer/footer.component';
import {SubheaderComponent} from './components/subheader/subheader.component';
import {NotFoundModule} from './components/not-found/not-found.module';
import {BookModule} from './components/book/book.module';
import {FilterBarModule} from './components/filter-bar/filter-bar.component';
import {SeriesModule} from './components/series/series.module';
import {AuthorModule} from './components/author/author.module';
import {HomeModule} from './components/home/home.component';
import {TagModule} from './components/tag/tag.module';
import {AuthentModule} from './components/authent/authent.module';
import {AuthGuard} from './components/authent/auth.guard';
import {AuthConfig, AuthHttp} from 'angular2-jwt';
import {NotificationService} from './components/notification/notification.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WindowService} from './core/util/window.service';
import {AuthGuardAdmin} from './components/authent/auth.guard.admin';
import {FlexLayoutModule} from '@angular/flex-layout';

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig(), http, options);
}

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    SubheaderComponent,
    MatInkDirective,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    FlexLayoutModule,

    MaterialModule,
    BrowserAnimationsModule,

    MatContentModule,
    MdPeekabooModule,
    AppRoutingModule,
    HomeModule,
    NotFoundModule,
    BookModule,
    SeriesModule,
    AuthorModule,
    TagModule,
    AuthentModule,
    FilterBarModule
  ],
  providers: [
    Media,
    TitleService,
    NotificationService,
    WindowService,
    { provide: ViewportHelper, useClass: BrowserViewportHelper },
    {
      provide: AuthHttp,
      useFactory: authHttpServiceFactory,
      deps: [Http, RequestOptions]
    },
    AuthGuard,
    AuthGuardAdmin
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
