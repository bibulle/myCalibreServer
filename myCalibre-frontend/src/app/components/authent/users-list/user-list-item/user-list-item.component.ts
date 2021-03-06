import {Component, EventEmitter, Input, NgModule, OnInit, Output} from '@angular/core';
import {User} from '../../user';
import {CommonModule} from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {UserProfileModule} from '../../profile/user-profile/user-profile.component';
import {NotificationService} from 'app/components/notification/notification.service';
import {UserService} from '../../user.service';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TranslateModule} from '@ngx-translate/core';
import {LocalizedDateModule} from '../../../../directives/localized-date.pipe';

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
