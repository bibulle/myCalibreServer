import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {HomeComponent} from './components/home/home.component';
import {NotFoundComponent} from './components/not-found/not-found.component';
import {BookListComponent} from './components/book/book-list/book-list.component';
import {SeriesListComponent} from './components/series/series-list/series-list.component';
import {BookPageComponent} from './components/book/book-page/book-page.component';
import {AuthorListComponent} from './components/author/author-list/author-list.component';
import {TagListComponent} from './components/tag/tag-list/tag-list.component';
import {LoginComponent} from './components/authent/login/login.component';
import {SignupComponent} from './components/authent/signup/signup.component';
import {AuthGuard} from './components/authent/auth.guard';
import {ProfileComponent} from './components/authent/profile/profile.component';
import {ConnectLocalComponent} from './components/authent/connect-local/connect-local.component';
import {UsersListComponent} from './components/authent/users-list/users-list.component';
import {AuthGuardAdmin} from './components/authent/auth.guard.admin';

const routes: Routes = [
  { path: '',               redirectTo: '/home', pathMatch: 'full'},
  { path: 'login',          component: LoginComponent                ,                                data: {label: 'route.login'  , menu: false}},
  { path: 'signup',         component: SignupComponent               ,                                data: {label: 'route.signup' , menu: false}},
  { path: 'profile',        component: ProfileComponent              , canActivate: [AuthGuard],      data: {label: 'route.profile', menu: false}},
  { path: 'users',          component: UsersListComponent            , canActivate: [AuthGuardAdmin], data: {label: 'route.users'  , menu: true  , admin: true}},
  { path: 'connect/local',  component: ConnectLocalComponent         , canActivate: [AuthGuard],      data: {label: 'route.connect', menu: false}},
  { path: 'home',           component: HomeComponent                 , canActivate: [AuthGuard],      data: {label: 'route.news'   , menu: true}},
  { path: 'books',          component: BookListComponent             , canActivate: [AuthGuard],      data: {label: 'route.books'  , menu: true}},
  { path: 'series',         component: SeriesListComponent           , canActivate: [AuthGuard],      data: {label: 'route.series' , menu: true}},
  { path: 'authors',        component: AuthorListComponent           , canActivate: [AuthGuard],      data: {label: 'route.authors', menu: true}},
  { path: 'tags',           component: TagListComponent              , canActivate: [AuthGuard],      data: {label: 'route.tags'   , menu: true}},
  { path: 'book/:id',       component: BookPageComponent             , canActivate: [AuthGuard],      data: {label: 'route.book'   , menu: false}},
  // { path: 'login',        component: LoginComponent },
  // { path: 'signup',       component: SignupComponent },
  // { path: 'awards',       component: AwardsComponent,       canActivate: [AuthGuard] },
  // { path: 'catalogue',    component: CatalogueComponent,    canActivate: [AuthGuard] },
  // { path: 'class',        component: CatalogueComponent,    canActivate: [AuthGuard], data: {onlyCurrent: true} },
  // { path: 'class/:id',    component: CoursePageComponent,   canActivate: [AuthGuard] },
  // { path: 'progress',     component: ProgressionComponent,  canActivate: [AuthGuard] },
  // // Show the 404 page for any routes that don't exist.
  { path: '**',           component: NotFoundComponent, data: {label: 'route.not-found', menu: false} }
];


@NgModule( {
  imports: [ RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
