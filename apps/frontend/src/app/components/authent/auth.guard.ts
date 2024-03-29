import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private _router: Router, private _userService: UserService) {}

  canActivate() {

    if (this._userService.isAuthent()) {
      // console.log("canActivate true");
      return true;
    }

    // not logged in so redirect to login page
    this._router.navigate(['/login']);
    // console.log("canActivate false");
    return false; 
  }
}
