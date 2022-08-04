import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { UserService } from './user.service';

@Injectable()
export class AuthGuardToken implements CanActivate {

  constructor(private _router: Router,
              private _userService: UserService,
              private _authGard: AuthGuard) { }

  async canActivate(route: ActivatedRouteSnapshot) {

    if (route && route.queryParams && route.queryParams['token']) {
      await this._userService.checkTemporaryToken(route.queryParams['token']);
    } 

    return this._authGard.canActivate();

  }
}
