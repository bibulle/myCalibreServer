import { NgModule } from '@angular/core';
import { RouterModule, Routes }   from '@angular/router';

// import { AuthGuard } from "./shared/auth-guard";
import { HomeComponent } from "./components/home/home.component";
import { NotFoundComponent } from "./components/not-found/not-found.component";
import { BookListComponent } from "./components/book/book-list/book-list.component";
import { SeriesListComponent } from "./components/series/series-list/series-list.component";
// import { LoginComponent } from "./login/login.component";
// import { SignupComponent } from "./signup/signup.component";
// import { AwardsComponent } from "./awards/awards.component";
// import { CatalogueComponent } from "./catalogue/catalogue.component";
// import { CoursePageComponent } from "./course/course-page/course-page.component";
// import { ProgressionComponent } from "./progression/progression.component";

const routes: Routes = [
  { path: '',             redirectTo: '/home', pathMatch: 'full'},
  { path: 'home',         component: HomeComponent                 , data: {label: 'News'}},
  { path: 'books',        component: BookListComponent             , data: {label: 'Books'}},
  { path: 'series',       component: SeriesListComponent           , data: {label: 'Series'}},
  { path: 'authors',      component: NotFoundComponent             , data: {label: 'Authors'}},
  // { path: 'login',        component: LoginComponent },
  // { path: 'signup',       component: SignupComponent },
  // { path: 'awards',       component: AwardsComponent,       canActivate: [AuthGuard] },
  // { path: 'catalogue',    component: CatalogueComponent,    canActivate: [AuthGuard] },
  // { path: 'class',        component: CatalogueComponent,    canActivate: [AuthGuard], data: {onlyCurrent: true} },
  // { path: 'class/:id',    component: CoursePageComponent,   canActivate: [AuthGuard] },
  // { path: 'progress',     component: ProgressionComponent,  canActivate: [AuthGuard] },
  // // Show the 404 page for any routes that don't exist.
  { path: '**',           component: NotFoundComponent, data: {label: 'Not found'} }
];


@NgModule( {
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
