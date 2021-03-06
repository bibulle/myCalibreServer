import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import {LoginComponent} from './login/login.component';
import {UserService} from './user.service';
import {SignupComponent} from './signup/signup.component';
import {ProfileButtonComponent} from './profile-button/profile-button.component';
import {ProfileComponent} from './profile/profile.component';
import {FormsModule} from '@angular/forms';
import {ConnectLocalComponent} from './connect-local/connect-local.component';
import {UsersListModule} from './users-list/users-list.component';
import {UserProfileModule} from './profile/user-profile/user-profile.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    UsersListModule,
    UserProfileModule,
    FlexLayoutModule,
    TranslateModule
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
