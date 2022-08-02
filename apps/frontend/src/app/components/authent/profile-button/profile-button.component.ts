import { Component, OnInit } from '@angular/core';
import {UserService} from '../user.service';
import {User} from '@my-calibre-server/api-interfaces';
import {Router} from '@angular/router';

@Component({
  selector: 'my-calibre-server-profile-button',
  templateUrl: './profile-button.component.html',
  styleUrls: ['./profile-button.component.scss']
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

}
