import {NgModule} from '@angular/core';

import {
  // MatButtonModule,
  // MatMenuModule,
  MatToolbarModule,
  MatIconModule,
  MatListModule,
  MatSidenavModule,
  MatSnackBarModule,
  // MatCardModule
} from '@angular/material';

@NgModule({
  imports: [
    // MatButtonModule,
    // MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatSnackBarModule,
    // MatCardModule
  ],
  exports: [
    // MatButtonModule,
    // MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatSnackBarModule
    // MatCardModule
  ]
})
export class MaterialModule {
}
