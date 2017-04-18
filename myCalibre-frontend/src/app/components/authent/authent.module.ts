import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MdCardModule, MdInputModule, MdButtonModule, MdTooltipModule, MdIconModule,
  MdAutocompleteModule
} from "@angular/material";

import { LoginComponent } from './login/login.component';
import { UserService } from "./user.service";
import { SignupComponent } from './signup/signup.component';
import { ProfileButtonComponent } from './profile-button/profile-button.component';
import { ProfileComponent } from './profile/profile.component';
import {FormsModule} from "@angular/forms";
import { ConnectLocalComponent } from './connect-local/connect-local.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdCardModule,
    MdInputModule,
    MdButtonModule,
    MdTooltipModule,
    MdIconModule
  ],
  declarations: [
    LoginComponent,
    SignupComponent,
    ProfileButtonComponent,
    ProfileComponent,
    ConnectLocalComponent
  ],
  providers: [
    UserService
  ],
  exports: [
    ProfileButtonComponent
  ]

})
export class AuthentModule { }
