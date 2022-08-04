import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ConnectLocalComponent } from './connect-local/connect-local.component';
import { LoginComponent } from './login/login.component';
import { ProfileButtonComponent } from './profile-button/profile-button.component';
import { ProfileComponent } from './profile/profile.component';
import { UserProfileModule } from './profile/user-profile/user-profile.component';
import { SignupComponent } from './signup/signup.component';
import { UserService } from './user.service';
import { UsersListModule } from './users-list/users-list.component';

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
    TranslateModule,
  ],
  declarations: [LoginComponent, SignupComponent, ProfileButtonComponent, ProfileComponent, ConnectLocalComponent, ChangePasswordComponent],
  providers: [UserService],
  exports: [ProfileButtonComponent],
})
export class AuthentModule {}
