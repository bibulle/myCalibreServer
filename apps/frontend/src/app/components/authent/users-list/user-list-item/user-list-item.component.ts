import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, Output } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User } from '@my-calibre-server/api-interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { LocalizedDateModule } from '../../../../directives/localized-date.pipe';
import { NotificationService } from '../../../notification/notification.service';
import { UserProfileModule } from '../../profile/user-profile/user-profile.component';
import { UserService } from '../../user.service';

@Component({
  selector: 'my-calibre-server-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss']
})
export class UserListItemComponent {

  @Input()
  user: User = {} as User;

  @Output()
  listChanged: EventEmitter<string> = new EventEmitter();

  @Output()
  mergeUser: EventEmitter<User> = new EventEmitter();

  userClosed = true;

  @Input()
  selectedMergeUser: User|undefined;


  constructor(private _userService: UserService,
              private _notificationService: NotificationService) { }

  // ngOnInit() {
  // }

  toggleUserClosed () {
    // console.log("toggle");
    if (this.selectedMergeUser !== this.user) {
      this.userClosed = !this.userClosed;

    }
  }

  adminChanged(event: MatSlideToggleChange) {
    this._userService.setUserAdmin(this.user, event.checked).then((user) => {
      this.user = user;
      this._notificationService.info("User saved");
    })
    .catch(err => {
      console.log(err);
      this._notificationService.error(err);
    });
  }

  remove() {
    if (this.user) {
      this._userService.remove(this.user)
      .then(() => {
        this._notificationService.info("User deleted");
        this.listChanged.emit('user deleted');
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText || err);
      });
    }


  }

  resetPassword() {
    if (this.user) {
      this._userService.resetPassword(this.user)
      .then((newPassword) => {
        this._notificationService.info('Password change to ' + newPassword);
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText || err);
      });
    }
  }

  merge() {
    this.mergeUser.emit(this.user);
  }

}

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    FormsModule,
    MatInputModule,
    UserProfileModule,
    FlexLayoutModule,
    TranslateModule,
    LocalizedDateModule
  ],
  declarations: [
    UserListItemComponent
  ],
  exports: [
    UserListItemComponent
  ]
})
export class UserListItemModule {
}
