import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material';
import {UserService} from '../authent/user.service';

@Injectable()
export class NotificationService {

  constructor(public _snackBar: MatSnackBar,
              private _userService: UserService) {
  }

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

    console.error(err);
    let message = this._extractMessage(err);
    console.error(message);
    this._display(message, 5000, ['error']);
  }

  _display(message: string, duration: number, extraClasses: [string]) {

    let config = new MatSnackBarConfig();
    config.duration = duration;
    config.extraClasses = extraClasses;

    this._snackBar.open(message, null, config);
  }

  _extractMessage(err: any) {
    let message = err.statusText || err;
    if (err['_body']) {
      let error = JSON.parse(err['_body'])
      console.log(error)
      if ( error.error && error.error.name === 'JsonWebTokenError') {
        this._userService.logout();
      }

      message = error.message || message;
    }

    return message;
  }
}
