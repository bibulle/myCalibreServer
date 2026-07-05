import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  imports: [
    MatButtonModule,
    // MatMenuModule,
    MatIconModule,
    MatSnackBarModule,
    // MatCardModule
  ],
  exports: [
    // MatButtonModule,
    // MatMenuModule,
    MatIconModule,
    MatSnackBarModule,
    // MatCardModule
  ],
})
export class MaterialModule {}
