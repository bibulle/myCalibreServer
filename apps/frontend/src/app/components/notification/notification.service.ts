import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { UserService } from '../authent/user.service';

@Injectable()
export class NotificationService {
  constructor(public _snackBar: MatSnackBar, private _userService: UserService) {}

  message(message: string) {
    // console.log(message);
    this._display(message, 5000, ['message']);
  }

  info(message: string) {
    console.log(message);
    this._display(message, 5000, null);
  }

  warn(message: string) {
    console.warn(message);
    this._display(message, 5000, ['warn']);
  }

  error(err: string) {
    console.error(JSON.stringify(err));
    const message = this._extractMessage(err);
    // console.error(message);
    this._display(message, 5000, ['error']);
  }

  _display(message: string, duration: number, extraClasses: [string] | null) {
    const config = new MatSnackBarConfig();
    config.duration = duration;
    if (extraClasses) {
      config.panelClass = extraClasses;
    }

    this._snackBar.open(message, undefined, config);
  }

  _extractMessage(err: any) {
    if (!err) {
      return 'Unknown error';
    }
    // Angular HttpClient HttpErrorResponse: parsed body is in err.error
    if (err.error && typeof err.error === 'object') {
      const body = err.error;
      if (body.error && body.error.name === 'JsonWebTokenError') {
        this._userService.logout();
      }
      return body.message || err.statusText || 'Unknown error';
    }
    // Legacy Angular Http module: body is a JSON string in _body
    if (err['_body']) {
      const error = JSON.parse(err['_body']);
      if (error.error && error.error.name === 'JsonWebTokenError') {
        this._userService.logout();
      }
      return error.message || err.statusText || 'Unknown error';
    }
    // Plain string
    if (typeof err === 'string') {
      return err;
    }
    return err.statusText || err.message || 'Unknown error';
  }
}
