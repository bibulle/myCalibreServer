import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MaterialModule} from './material.module';

import {AppComponent} from './app/app.component';
import {AppRoutingModule} from './app-routing.module';
import {TitleService} from './app/title.service';

import {MdPeekabooModule} from './directives/peekaboo.directive';
import {MatInkDirective} from './directives/link.directive';

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
import {NotificationService} from './components/notification/notification.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WindowService} from './core/util/window.service';
import {AuthGuardAdmin} from './components/authent/auth.guard.admin';
import {FlexLayoutModule} from '@angular/flex-layout';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {JwtModule} from '@auth0/angular-jwt';
import {UserService} from './components/authent/user.service';
import {MissingTranslationHandler, MissingTranslationHandlerParams, TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import {MatRatingModule} from './components/rating/rating.component';

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    console.log(params);
    return '?' + params.key + '?';
  }
}
registerLocaleData(localeFr, 'fr');
registerLocaleData(localeEn, 'en');

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    SubheaderComponent,
    MatInkDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: UserService.tokenGetter,
        whitelistedDomains: ['localhost:4000' as (string | RegExp), 'bib.bibulle.fr', new RegExp('^null$')]
//        whitelistedDomains: new Array(new RegExp('^null$'))
      }
    }),
    FlexLayoutModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      missingTranslationHandler: {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
      // useDefaultLang: false
    }),

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
    FilterBarModule,
    MatRatingModule
  ],
  providers: [
    TitleService,
    NotificationService,
    WindowService,
    AuthGuard,
    AuthGuardAdmin
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
