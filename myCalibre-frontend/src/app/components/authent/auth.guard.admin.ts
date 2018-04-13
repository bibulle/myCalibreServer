import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class AuthGuardAdmin implements CanActivate {

  constructor(private _router: Router,
              private _userService: UserService) { }

  canActivate() {

    if (this._userService.isUserAdmin() ) {
      // console.log("canActivate true");
      return true;
    }

    // not logged in so redirect to login page
    this._router.navigate(['/login']);
    // console.log("canActivate false");
    return false;
  }
}
