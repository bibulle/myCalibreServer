import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@my-calibre-server/api-interfaces';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { UserService } from '../user.service';

@Component({
  selector: 'my-calibre-server-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {


  user: User = {} as User;
  password1 = '';
  password2 = '';
  passwordsState = PasswordState.EMPTY;
  passwordsStateEnum = PasswordState

  constructor(
    private _filterService: FilterService, 
    private _userService: UserService, 
    private _notificationService: NotificationService, 
    private _router: Router) {}

  ngOnInit(): void {
    this._filterService.update(new Filter({ not_displayed: true }));

    this._userService.userObservable().subscribe(
      user => {
        this.user = user;
      });

  }

  save(event: Event) {
    event.preventDefault();
    this._userService.changePassword(this.password1)
    .then(() => {
      this._notificationService.info("Password changed");
      this._router.navigate(['/profile']);
    })
    .catch((reason)=> {
      this._notificationService.error(reason);
    });
  }

  /**
   * Test passwords changes
   */
   change() {
    // console.log(`change '${this.password1}' '${this.password2}'`);
    if ((this.password1 === '') || (this.password2 === '')) {
      this.passwordsState = PasswordState.EMPTY
    } else if (this.password1 != this.password2) {
      this.passwordsState = PasswordState.DIFFERENTS
    } else {
      this.passwordsState = PasswordState.OK
    }
  }

}

enum PasswordState {
  OK,
  DIFFERENTS,
  EMPTY
}
