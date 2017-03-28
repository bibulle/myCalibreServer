import { NgModule } from '@angular/core';
import { RouterModule, Routes }   from '@angular/router';

import { HomeComponent } from "./components/home/home.component";
import { NotFoundComponent } from "./components/not-found/not-found.component";
import { BookListComponent } from "./components/book/book-list/book-list.component";
import { SeriesListComponent } from "./components/series/series-list/series-list.component";
import { BookPageComponent } from "./components/book/book-page/book-page.component";
import { AuthorListComponent } from "./components/author/author-list/author-list.component";
import { TagListComponent } from "./components/tag/tag-list/tag-list.component";
import { LoginComponent } from "./components/authent/login/login.component";
import { SignupComponent } from "./components/authent/signup/signup.component";
import { AuthGuard } from "./components/authent/auth.guard";
import {ProfileComponent} from "./components/authent/profile/profile.component";

const routes: Routes = [
  { path: '',             redirectTo: '/home', pathMatch: 'full'},
  { path: 'login',        component: LoginComponent                ,                           data: {label: 'Login'  , menu: false}},
  { path: 'signup',       component: SignupComponent               ,                           data: {label: 'Signup' , menu: false}},
  { path: 'profile',      component: ProfileComponent              , canActivate: [AuthGuard], data: {label: 'Profile', menu: false}},
  { path: 'home',         component: HomeComponent                 , canActivate: [AuthGuard], data: {label: 'News'   , menu: true}},
  { path: 'books',        component: BookListComponent             , canActivate: [AuthGuard], data: {label: 'Books'  , menu: true}},
  { path: 'series',       component: SeriesListComponent           , canActivate: [AuthGuard], data: {label: 'Series' , menu: true}},
  { path: 'authors',      component: AuthorListComponent           , canActivate: [AuthGuard], data: {label: 'Authors', menu: true}},
  { path: 'tags',         component: TagListComponent              , canActivate: [AuthGuard], data: {label: 'Tags'   , menu: true}},
  { path: 'book/:id',     component: BookPageComponent             , canActivate: [AuthGuard], data: {label: 'Book'   , menu: false}},
  // { path: 'login',        component: LoginComponent },
  // { path: 'signup',       component: SignupComponent },
  // { path: 'awards',       component: AwardsComponent,       canActivate: [AuthGuard] },
  // { path: 'catalogue',    component: CatalogueComponent,    canActivate: [AuthGuard] },
  // { path: 'class',        component: CatalogueComponent,    canActivate: [AuthGuard], data: {onlyCurrent: true} },
  // { path: 'class/:id',    component: CoursePageComponent,   canActivate: [AuthGuard] },
  // { path: 'progress',     component: ProgressionComponent,  canActivate: [AuthGuard] },
  // // Show the 404 page for any routes that don't exist.
  { path: '**',           component: NotFoundComponent, data: {label: 'Not found', menu: false} }
];


@NgModule( {
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
