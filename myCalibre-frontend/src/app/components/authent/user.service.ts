import { Injectable } from '@angular/core';
import { Http, Headers } from "@angular/http";
import { JwtHelper, tokenNotExpired, AuthHttp } from "angular2-jwt";


import { environment } from "../../../environments/environment";
import { User } from "./user";


@Injectable()
export class UserService {

  private loggedIn = false;

  private keyTokenId = 'id_token';

  private user = {} as User;
  private jwtHelper: JwtHelper = new JwtHelper();

  constructor (private _http: Http) { }


  /**
   * Check authentication locally (is the jwt not expired)
   */
  checkAuthent () {
    console.log("checkAuthent");
    let jwt = localStorage.getItem(this.keyTokenId);

    if (!jwt || !tokenNotExpired()) {
      this.user = {} as User;
    } else {
      this.user = this.jwtHelper.decodeToken(jwt) as User;
    }

    console.log(this.user);

    // if only username add to lastname
    //if (!this.user.lastname && !this.user.firstname) {
    //  this.user.lastname = this.user.username;
    //}

    //this.userSubject.next(this.user);

  }

  /**
   * Login (and get a JWT token)
   * @param email
   * @param password
   * @returns {Promise<void>}
   */
  login (email, password): Promise<void> {
    let body = JSON.stringify({ email, password });

    return new Promise<void>((resolve, reject) => {
      this._http
          .post(
            environment.serverUrl + 'authent/login',
            body,
            {
              headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              })
            }
          )
          .timeout(3000)
          .toPromise()
          .then(res => {
            const data = res.json();
            console.log(res.json());
            if (data[this.keyTokenId]) {
              localStorage.setItem(this.keyTokenId, data[this.keyTokenId]);
              this.loggedIn = true;
              this.checkAuthent();
              resolve();
            }
            reject();
          })
          .catch(error => {
            const msg = error.statusText || error.message || 'Connection error';
            console.error('Login', msg);
            //this._notificationService.error('Login', msg);
            this.checkAuthent();
            reject();
          })
    });
  }

  /**
   * Signup
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  signup (email, password): Promise<void> {
    let body = JSON.stringify({ email, password });

    console.log(body);

    return new Promise<void>((resolve, reject) => {
      this._http
          .post(
            environment.serverUrl + 'authent/signup',
            body,
            {
              headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              })
            }
          )
          .timeout(3000)
          .toPromise()
          .then(res => {
            const data = res.json();
            if (data[this.keyTokenId]) {
              localStorage.setItem(this.keyTokenId, data[this.keyTokenId]);
              this.loggedIn = true;
              this.checkAuthent();
              resolve();
            }
            reject();
          })
          .catch(error => {
            const msg = error.statusText || error.message || 'Connection error';
            console.error('Login', msg);
            //this._notificationService.error('Login', msg);
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
    this.loggedIn = false;
    this.checkAuthent();
  }

}
