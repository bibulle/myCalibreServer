import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './components/authent/auth.guard';
import { AuthGuardAdmin } from './components/authent/auth.guard.admin';
import { AuthGuardToken } from './components/authent/auth.guard.token';
import { ChangePasswordComponent } from './components/authent/change-password/change-password.component';
import { ConnectLocalComponent } from './components/authent/connect-local/connect-local.component';
import { LoginComponent } from './components/authent/login/login.component';
import { ProfileComponent } from './components/authent/profile/profile.component';
import { SignupComponent } from './components/authent/signup/signup.component';
import { UsersListComponent } from './components/authent/users-list/users-list.component';
import { AuthorListComponent } from './components/author/author-list/author-list.component';
import { BookListComponent } from './components/book/book-list/book-list.component';
import { BookPageComponent } from './components/book/book-page/book-page.component';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SeriesListComponent } from './components/series/series-list/series-list.component';
import { TagListComponent } from './components/tag/tag-list/tag-list.component';

const routes: Routes = [
  { path: '',               redirectTo: '/home', pathMatch: 'full'},
  { path: 'login',          component: LoginComponent                ,                                data: {label: 'route.login'   , menu: false}},
  { path: 'signup',         component: SignupComponent               ,                                data: {label: 'route.signup'  , menu: false}},
  { path: 'profile',        component: ProfileComponent              , canActivate: [AuthGuard],      data: {label: 'route.profile' , menu: false}},
  { path: 'users',          component: UsersListComponent            , canActivate: [AuthGuardAdmin], data: {label: 'route.users'   , menu: true  , admin: true}},
  { path: 'connect/local',  component: ConnectLocalComponent         , canActivate: [AuthGuard],      data: {label: 'route.connect' , menu: false}},
  { path: 'changepassword', component: ChangePasswordComponent       , canActivate: [AuthGuardToken, AuthGuard],      data: {label: 'route.changepw', menu: false}},
  { path: 'home',           component: HomeComponent                 , canActivate: [AuthGuard],      data: {label: 'route.news'    , menu: true}},
  { path: 'books',          component: BookListComponent             , canActivate: [AuthGuard],      data: {label: 'route.books'   , menu: true}},
  { path: 'series',         component: SeriesListComponent           , canActivate: [AuthGuard],      data: {label: 'route.series'  , menu: true}},
  { path: 'authors',        component: AuthorListComponent           , canActivate: [AuthGuard],      data: {label: 'route.authors' , menu: true}},
  { path: 'tags',           component: TagListComponent              , canActivate: [AuthGuard],      data: {label: 'route.tags'    , menu: true}},
  { path: 'book/:id',       component: BookPageComponent             , canActivate: [AuthGuard],      data: {label: 'route.book'    , menu: false}},
  // Show the 404 page for any routes that don't exist.
  { path: '**',           component: NotFoundComponent, data: {label: 'route.not-found', menu: false} }
];


@NgModule( {
  imports: [ RouterModule.forRoot(routes, {}) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
