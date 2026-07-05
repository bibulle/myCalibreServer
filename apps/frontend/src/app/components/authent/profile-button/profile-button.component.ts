import { Component, OnInit } from '@angular/core';
import {UserService} from '../user.service';
import {User} from '@my-calibre-server/api-interfaces';
import {Router} from '@angular/router';

@Component({
    selector: 'my-calibre-server-profile-button',
    templateUrl: './profile-button.component.html',
    styleUrls: ['./profile-button.component.scss'],
    standalone: false
})
export class ProfileButtonComponent implements OnInit {

  user: User = {} as User;

  router: Router;

  constructor(private _userService: UserService,
              private _router: Router) {
    this.router = _router;
  }

  ngOnInit() {
    this._userService.checkAuthent();
    this._userService.userObservable().subscribe(
      user => {
        this.user = user;
      });
  }

  openProfile(event:Event, user:User) {
    this._router.navigate(['/profile'])
  }

  /**
   * One or two initials shown in the header avatar bubble.
   */
  initials(): string {
    const { firstname, lastname, username } = this.user.local ?? {};
    if (firstname || lastname) {
      return `${(firstname ?? '').charAt(0)}${(lastname ?? '').charAt(0)}`.toUpperCase();
    }
    return (username ?? '').charAt(0).toUpperCase();
  }

}
