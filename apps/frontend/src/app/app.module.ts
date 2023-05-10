import { NgModule, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from './material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TitleService } from './app/title.service';

import { MatInkDirective } from './directives/link.directive';
import { MdPeekabooModule } from './directives/peekaboo.directive';

import { MatContentModule } from './components/content/content.component';
import { FooterComponent } from './components/footer/footer.component';
import { registerLocaleData } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JwtModule } from '@auth0/angular-jwt';
import { MissingTranslationHandler, MissingTranslationHandlerParams, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthGuard } from './components/authent/auth.guard';
import { AuthGuardAdmin } from './components/authent/auth.guard.admin';
import { AuthentModule } from './components/authent/authent.module';
import { UserService } from './components/authent/user.service';
import { AuthorModule } from './components/author/author.module';
import { BookModule } from './components/book/book.module';
import { FilterBarModule } from './components/filter-bar/filter-bar.component';
import { HomeModule } from './components/home/home.component';
import { NotFoundModule } from './components/not-found/not-found.module';
import { NotificationService } from './components/notification/notification.service';
import { MatRatingModule } from './components/rating/rating.component';
import { SeriesModule } from './components/series/series.module';
import { TagModule } from './components/tag/tag.module';
import { WindowService } from './core/util/window.service';
import { AuthGuardToken } from './components/authent/auth.guard.token';
import { MatButtonModule } from '@angular/material/button';
import { ServiceWorkerModule } from '@angular/service-worker';

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
    // SubheaderComponent,
    MatInkDirective,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: UserService.tokenGetter,
        allowedDomains: ['localhost:4000' as string | RegExp, 'bib.bibulle.fr', new RegExp('^null$')],
        //        whitelistedDomains: new Array(new RegExp('^null$'))
      },
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      missingTranslationHandler: { provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler },
      //       // useDefaultLang: false
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
    MatRatingModule,
    MatButtonModule,
    // ServiceWorkerModule.register('ngsw-worker.js', {
    //   enabled: !isDevMode(),
    //   // Register the ServiceWorker as soon as the application is stable
    //   // or after 30 seconds (whichever comes first).
    //   registrationStrategy: 'registerWhenStable:30000'
    // }),
  ],
  providers: [TitleService, NotificationService, WindowService, AuthGuard, AuthGuardToken, AuthGuardAdmin],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
