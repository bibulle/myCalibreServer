import {NgModule} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { 
// MatButtonModule,
// MatMenuModule,
MatToolbarModule } from '@angular/material/toolbar';

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
