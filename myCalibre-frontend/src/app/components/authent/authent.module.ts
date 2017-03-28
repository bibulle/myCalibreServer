import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MdCardModule, MdInputModule, MdButtonModule } from "@angular/material";

import { LoginComponent } from './login/login.component';
import { UserService } from "./user.service";
import { SignupComponent } from './signup/signup.component';
import { ProfileButtonComponent } from './profile-button/profile-button.component';
import { ProfileComponent } from './profile/profile.component';
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdCardModule,
    MdInputModule,
    MdButtonModule,
  ],
  declarations: [
    LoginComponent,
    SignupComponent,
    ProfileButtonComponent,
    ProfileComponent
  ],
  providers: [
    UserService
  ],
  exports: [
    ProfileButtonComponent
  ]

})
export class AuthentModule { }
