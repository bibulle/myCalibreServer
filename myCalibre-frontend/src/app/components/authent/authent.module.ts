import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {MdButtonModule, MdCardModule, MdIconModule, MdInputModule, MdTooltipModule} from "@angular/material";

import {LoginComponent} from "./login/login.component";
import {UserService} from "./user.service";
import {SignupComponent} from "./signup/signup.component";
import {ProfileButtonComponent} from "./profile-button/profile-button.component";
import {ProfileComponent} from "./profile/profile.component";
import {FormsModule} from "@angular/forms";
import {ConnectLocalComponent} from "./connect-local/connect-local.component";
import {UsersListModule} from "./users-list/users-list.component";
import {UserProfileModule} from "./profile/user-profile/user-profile.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdCardModule,
    MdInputModule,
    MdButtonModule,
    MdTooltipModule,
    MdIconModule,
    UsersListModule,
    UserProfileModule
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
