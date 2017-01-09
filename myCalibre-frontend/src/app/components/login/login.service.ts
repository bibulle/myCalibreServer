import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Logger } from "angular2-logger/core";
import { Http, Response , Headers} from "@angular/http";
import { Observable, BehaviorSubject } from "rxjs";
import { User } from "./user";
import { JwtHelper, tokenNotExpired } from "angular2-jwt";
import { MdSnackBar } from "@angular/material";

@Injectable()
export class LoginService {

  private user = new User({});
  private previousUserJSON = "";
  private jwtHelper: JwtHelper = new JwtHelper();
  private userSubject: BehaviorSubject<User>;
  private keyTokenId = 'id_token';

  constructor(private _http: Http,
              private _logger: Logger,
              private _snackBar: MdSnackBar) {
    this.userSubject = new BehaviorSubject<User>(this.user);

    let timer = Observable.timer(3 * 1000, 3 * 1000);
    timer.subscribe(() => {
      this.checkAuthent();
    });

  }

  /**
   * Login (and get a JWT token)
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  login (username, password): Promise<void> {
    //let body = JSON.stringify({ username, password });
    let body = `username=${username}&password=${password}`;

    return new Promise<void>((resolve, reject) => {
      this._http
          .post(
            environment.serverUrl + 'api/login',
            body,
            {headers:  new Headers({
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            })}
          )
          .timeout(3000)
          .toPromise()
          .then(res => {
            const data = res.json();
            if (data['id_token']) {
              localStorage.setItem(this.keyTokenId, data['id_token']);
              //this.loggedIn = true;
              this.checkAuthent();
              resolve();
            }
            reject();
          })
          .catch((error: Response) => {

            let msg = error.statusText || 'Connection error';

            const err = error.json();
            if (err) {
              if (err.error && err.message) {
                msg = err.error+" : "+err.message;
              } else {
                msg = err;
              }
            }
            //this._logger.error('Login', msg);
            this._snackBar.open(msg, null, {duration: 3000});
            this.checkAuthent();
            reject();
          })
    });
  }

  /**
   * Logout (just remove the JWT token)
   */
  logout () {
    localStorage.removeItem(this.keyTokenId);
    //this.loggedIn = false;
    this.checkAuthent();
  }


  /**
   * Get the observable on user changes
   * @returns {Observable<User>}
   */
  userObservable (): Observable<User> {
    return this.userSubject.distinctUntilKeyChanged('username');
  }

  /**
   * Check authentication locally (is the jwt not expired)
   */
  checkAuthent () {
    //console.log("checkAuthent");
    let jwt = localStorage.getItem(this.keyTokenId);

    if (!jwt || !tokenNotExpired()) {
      this.user = new User({});
    } else {
      this.user = new User(this.jwtHelper.decodeToken(jwt));
    }

    //this._logger.info(this.user);

    // if only username add to lastname
    if (!this.user.lastname && !this.user.firstname) {
      this.user.lastname = this.user.username;
    }

    if (this.previousUserJSON != JSON.stringify(this.user)) {
      this.previousUserJSON = JSON.stringify(this.user);
      this.userSubject.next(this.user);
    }


  }


}
