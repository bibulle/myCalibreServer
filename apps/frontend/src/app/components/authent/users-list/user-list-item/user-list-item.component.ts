import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, Output, ChangeDetectionStrategy } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '@my-calibre-server/api-interfaces';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDateModule } from '../../../../directives/localized-date.pipe';
import { NotificationService } from '../../../notification/notification.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'my-calibre-server-user-list-item',
    templateUrl: './user-list-item.component.html',
    styleUrls: ['./user-list-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
      .then((message) => {
        this._notificationService.info(message);
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
    MatSlideToggleModule,
    MatTooltipModule,
    TranslatePipe,
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
