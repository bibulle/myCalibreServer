import {Injectable} from '@angular/core';
import {Http, Headers} from "@angular/http";
import {JwtHelper, tokenNotExpired} from "angular2-jwt";
import {AuthHttp} from "angular2-jwt";


import {environment} from "../../../environments/environment";
import {User} from "./user";
import {BehaviorSubject, Observable} from "rxjs";
import {WindowService} from "../../core/util/window.service";


@Injectable()
export class UserService {

  private loggedIn = false;

  private userSubject: BehaviorSubject<User>;

  private keyTokenId = 'id_token';

  private user = {} as User;
  private jwtHelper: JwtHelper = new JwtHelper();

  constructor(private _http: Http,
              private _authHttp: AuthHttp) {

    this.loggedIn = !!localStorage.getItem(this.keyTokenId);

    this.userSubject = new BehaviorSubject<User>(this.user);

    let timer = Observable.timer(3 * 1000, 3 * 1000);
    timer.subscribe(() => {
      this.checkAuthent();
    });

  }


  /**
   * Get the observable on user changes
   * @returns {Observable<User>}
   */
  userObservable(): Observable<User> {
    return this.userSubject.distinctUntilChanged(
      (a, b) => {
        //console.log(JSON.stringify(a.local));
        //console.log(JSON.stringify(b.local));
        return JSON.stringify(a) === JSON.stringify(b)
      }
    );
  }

  /**
   * Check authentication locally (is the jwt not expired)
   */
  checkAuthent() {
    //console.log("checkAuthent");
    let jwt = localStorage.getItem(this.keyTokenId);

    if (!jwt || !tokenNotExpired()) {
      this.user = {} as User;
    } else {
      this.user = this.jwtHelper.decodeToken(jwt) as User;
    }

    //console.log(this.user);

    // if only username add to lastname
    //if (this.user.local && !this.user.local.lastname && !this.user.local.firstname) {
    //  this.user.local.lastname = this.user.local.username;
    //}

    this.userSubject.next(this.user);

  }

  /**
   * Login (and get a JWT token)
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  login(username, password): Promise<void> {
    let body = JSON.stringify({username, password});

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
          //console.log(res.json());
          if (data[this.keyTokenId]) {
            localStorage.setItem(this.keyTokenId, data[this.keyTokenId]);
            this.loggedIn = true;
            this.checkAuthent();
            resolve();
          }
          reject();
        })
        .catch(error => {
          this.checkAuthent();

          const msg = UserService._getMSgFromError(error);
          reject(msg);
        })
    });
  }

  /**
   * Login with facebook code (and get a JWT token)
   * @param code
   * @returns {Promise<void>}
   */
  loginFacebook(code): Promise<void> {
    //console.log("loginFacebook "+code);
    return new Promise<void>((resolve, reject) => {
      this._http
        .get(
          environment.serverUrl + 'authent/facebook/login?code=' + code,
          {
            headers: new Headers({
              'Accept': 'application/json',
            })
          }
        )
        .timeout(3000)
        .toPromise()
        .then(res => {
          const data = res.json();
          //console.log(res.json());
          if (data[this.keyTokenId]) {
            localStorage.setItem(this.keyTokenId, data[this.keyTokenId]);
            this.loggedIn = true;
            this.checkAuthent();
            resolve();
          } else {
            this.checkAuthent();
            reject("Error");
          }
        })
        .catch(error => {
          this.checkAuthent();

          const msg = UserService._getMSgFromError(error);
          reject(msg);
        })
    });
  }

  /**
   * Signup
   * @param username
   * @param password
   * @param firstname
   * @param lastname
   * @param email
   * @returns {Promise<void>}
   */
  signup(username, password, firstname, lastname, email): Promise<void> {
    let body = JSON.stringify({username, password, firstname, lastname, email});

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
          reject("System error");
        })
        .catch(error => {
          this.checkAuthent();

          const msg = UserService._getMSgFromError(error);
          reject(msg);
        })
    });
  }

  /**
   * Save a user
   * @param user
   * @returns {Promise<void>}
   */
  save(user: User): Promise<void> {
    let body = JSON.stringify({user});

    return new Promise<void>((resolve, reject) => {
      this._authHttp
        .post(
          environment.serverUrl + 'authent/save',
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
          reject("System error");
        })
        .catch(error => {
          this.checkAuthent();

          const msg = UserService._getMSgFromError(error);
          reject(msg);
        })
    });
  }

  /**
   * Logout (just remove the JWT token)
   */
  logout() {
    localStorage.removeItem(this.keyTokenId);
    this.loggedIn = false;
    this.checkAuthent();
  }


  private loopCount = 600;
  private intervalLength = 100;

  private windowHandle: any = null;
  private intervalId: any = null;

  /**
   *
   */
  startLoginFacebook() {
    //console.log("startLoginFacebook");
    const facebookUrlBase = `${environment.serverUrl}authent/facebook`;
    const oAuthCalbackUrl = "/assets/logged.html";


    return new Promise<void>((resolve, reject) => {
      let loopCount = this.loopCount;
      this.windowHandle = WindowService.createWindow(facebookUrlBase, 'OAuth2 Login');

      this.intervalId = setInterval(() => {
        let parsed;
        if (loopCount-- < 0) {
          // Too many try... stop it
          clearInterval(this.intervalId);
          this.windowHandle.close();
          this.checkAuthent();
          console.error("Time out : close logging window");
          reject("Time out");
        } else {

          // Read th URL in the window
          let href: string;
          try {
            href = this.windowHandle.location.href;
          } catch (e) {
            //console.log('Error:', e);
          }

          if (href != null) {

            // We got an answer...
          //console.log(href);

            // try to find the code
            const re = /[?&](code|access_token)=(.*)/;
            const found = href.match(re);

            if (found) {
              clearInterval(this.intervalId);
              this.windowHandle.close();

              parsed = this._parseQueryString(href.replace(new RegExp(`^.*${oAuthCalbackUrl}[?]`), ""));

              if (parsed.code) {
                // we got the code... login
                this.loginFacebook(parsed.code)
                  .then(() => {
                    resolve();
                  })
                  .catch(msg => {
                    this.checkAuthent();
                    reject(msg);
                  })
              } else {
                console.error("oAuth callback without and with code...?.. "+href);
                this.checkAuthent();
                reject("login error");
              }

            } else {
              // http://localhost:3000/auth/callback#error=access_denied
              if (href.indexOf(oAuthCalbackUrl) > 0) {
                // If error
                clearInterval(this.intervalId);
                this.windowHandle.close();
                this.checkAuthent();

                parsed = this._parseQueryString(href.replace(new RegExp(`^.*${oAuthCalbackUrl}[?]`), ""));

                if (parsed.error_message) {
                  reject(parsed.error_message.replace(/[+]/g, " "));
                } else {
                  reject("Login error");
                }
              }
            }
          }

        }
      }, this.intervalLength)
    })

  }


  /**
   * get user message from error
   * @param error
   * @returns string
   * @private
   */
  private static _getMSgFromError(error): string {

    // Try to get the content
    const data = error.json();
    if (data && data.error) {
      if (data.error instanceof Array) {
        error = data.error[data.error.length - 1];
      } else if (data.message) {
        error = "Systeme error : " + data.message;
      } else {
        error = data.error;
      }
    }

    return error.statusText || error.message || error || 'Connection error';
  }

  /**
   * Parse a query string (lifted from https://github.com/sindresorhus/query-string)
   * @param str
   * @returns {{}}
   */
  private _parseQueryString(str) {
    //log("_parseQueryString : "+str);
    if (typeof str !== 'string') {
      return {};
    }

    str = str.trim().replace(/^[?#&]/, '');

    if (!str) {
      return {};
    }

    return str.split('&').reduce(function (ret, param) {
      const parts = param.replace(/[+]/g, ' ').split('=');
      // Firefox (pre 40) decodes `%3D` to `=`
      // https://github.com/sindresorhus/query-string/pull/37
      let key = parts.shift();
      let val = parts.length > 0 ? parts.join('=') : undefined;

      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }

      return ret;
    }, {});
  };


}
