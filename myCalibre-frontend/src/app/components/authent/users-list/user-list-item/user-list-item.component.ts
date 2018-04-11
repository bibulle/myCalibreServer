import {Component, EventEmitter, Input, NgModule, OnInit, Output} from '@angular/core';
import {User} from '../../user';
import {CommonModule} from '@angular/common';
import {MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatInputModule, MatSlideToggleModule} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {UserProfileModule} from '../../profile/user-profile/user-profile.component';
import {NotificationService} from 'app/components/notification/notification.service';
import {UserService} from '../../user.service';

@Component({
  selector: 'app-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss']
})
export class UserListItemComponent implements OnInit {

  @Input()
  user: User;

  @Output()
  listChanged: EventEmitter<string> = new EventEmitter();

  @Output()
  mergeUser: EventEmitter<User> = new EventEmitter();

  userClosed = true;

  @Input()
  selectedMergeUser: User = null;


  constructor(private _userService: UserService,
              private _notificationService: NotificationService) { }

  ngOnInit() {
  }

  toggleUserClosed () {
    // console.log("toggle");
    if (this.selectedMergeUser !== this.user) {
      this.userClosed = !this.userClosed;

    }
  }

  remove() {
    this._userService.remove(this.user)
      .then(() => {
        this.listChanged.emit('user deleted');
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText || err);
      });


  }

  resetPassword() {
    this._userService.resetPassword(this.user)
      .then((newPassword) => {
        this._notificationService.info('Password change to ' + newPassword);
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText || err);
      });


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
    UserProfileModule
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
