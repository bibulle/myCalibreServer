import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MdCardModule, MdInputModule, MdButtonModule, MdRipple, MdRippleModule } from "@angular/material";

import { LoginComponent } from './login/login.component';
import { UserService } from "./user.service";
import { SignupComponent } from './signup/signup.component';

@NgModule({
  imports: [
    CommonModule,
    MdCardModule,
    MdInputModule,
    MdButtonModule,

  ],
  declarations: [
    LoginComponent,
    SignupComponent
  ],
  providers: [
    UserService
  ]

})
export class AuthentModule { }
