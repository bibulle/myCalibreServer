import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {AuthConfigConsts, JwtHelper, tokenNotExpired} from 'angular2-jwt';
import { Response } from '@angular/http';
import {AuthHttp} from 'angular2-jwt';


import {environment} from '../../../environments/environment';
import {User} from './user';
import {BehaviorSubject, Observable} from 'rxjs';
import {WindowService} from '../../core/util/window.service';


enum LoginProvider { FACEBOOK, GOOGLE }

@Injectable()
export class UserService {

  static keyTokenId = 'id_token';

  private loggedIn = false;

  private userSubject: BehaviorSubject<User>;

  private user = {} as User;
  private jwtHelper: JwtHelper = new JwtHelper();

  private loopCount = 600;
  private intervalLength = 100;

  private windowHandle: any = null;
  private intervalId: any = null;

  /**
   * get user message from error
   * @param error
   * @returns string
   * @private
   */
  private static _getMSgFromError(error): string {

    console.error(error);
    // Try to get the content
    try {
      const data = error.json();
      if (data && data.error) {
        if (data.error instanceof Array) {
          error = data.error[data.error.length - 1];
        } else if (data.message) {
          error = 'Systeme error : ' + data.message;
        } else {
          error = data.error;
        }
      }
    } catch (er) {
      console.error(er)
    }

    return error.statusText || error.message || error || 'Connection error';
  }

  constructor(private _http: Http,
              private _authHttp: AuthHttp) {

    this.loggedIn = !!localStorage.getItem(AuthConfigConsts.DEFAULT_TOKEN_NAME);

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
    return this.userSubject
      // .debounceTime(200)
      .distinctUntilChanged(
        (a, b) => {
          // console.log(JSON.stringify(a.local));
          // console.log(JSON.stringify(b.local));
          return JSON.stringify(a) === JSON.stringify(b)
        }
      );
  }

  /**
   * Check authentication locally (is the jwt not expired)
   * @returns {boolean} are we authenticate
   */
  checkAuthent(emitEvent = true): boolean {
    // console.log("checkAuthent");
    let ret = false;

    let jwt = localStorage.getItem(AuthConfigConsts.DEFAULT_TOKEN_NAME);

    if (!jwt || !tokenNotExpired()) {
      this.user = {} as User;
    } else {
      this.user = this.jwtHelper.decodeToken(jwt) as User;
      ret = true;
    }

    // console.log(this.user);

    // if only username add to lastname
    // if (this.user.local && !this.user.local.lastname && !this.user.local.firstname) {
    //  this.user.local.lastname = this.user.local.username;
    // }

    if (emitEvent) {
      this.userSubject.next(this.user);
    }

    return ret;
  }

  /**
   * Get the logged user
   * @returns {User}
   */
  getUser(): User {
    this.checkAuthent();
    return this.user;
  }

  /**
   * Is the logged user admin
   * @returns {boolean}
   */
  isUserAdmin(): boolean {
    this.checkAuthent();
    return (this.user && this.user.local && (this.user.local.isAdmin === true));
    // return true;
  }

  /**
   * Login (and get a JWT token)
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  login(username, password): Promise<User> {
    let body = JSON.stringify({username, password});
    let url = environment.serverUrl + 'authent/login';

    return this._doPost(body, url);
  }

  /**
   * Connect Local
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  connectLocal(username, password): Promise<User> {
    let body = JSON.stringify({username, password});
    let url = environment.serverUrl + 'authent/connect/local';

    return this._doPost(body, url);
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
  signup(username, password, firstname, lastname, email): Promise<User> {
    let body = JSON.stringify({username, password, firstname, lastname, email});
    let url = environment.serverUrl + 'authent/signup';

    return this._doPost(body, url);
  }

  /**
   * Save a user
   * @param user
   * @returns {Promise<User>}
   */
  save(user: User): Promise<User> {
    let body = JSON.stringify({user});
    let url = environment.serverUrl + 'authent/save';

    return this._doPost(body, url);
  }

  /**
   * Delete a user
   * @param user
   * @returns {Promise<User>}
   */
  remove(user: User): Promise<User|string> {
    return this._doGet(environment.serverUrl + 'authent/delete?userId=' + user.id);
  }

  /**
   * Reset a password
   * @param user
   * @returns {Promise<string>}
   */
  resetPassword(user: User): Promise<User|string> {
    return this._doGet(environment.serverUrl + 'authent/reset?userId=' + user.id);
  }

  /**
   * Get all users
   * @returns {Promise<User[]>}
   */
  getAll(): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
      this._authHttp.get(environment.serverUrl + 'authent/list')
        // .map((res: Response) => res.json().data as User[])
        .subscribe(
          (res: Response) => {
            resolve(res.json().data as User[]);
          },
          err => {
            reject(err);
          },
        );
    });
  }

  /**
   * Merge two users
   * @returns {Promise<User[]>}
   */
  merge(user1: User, user2: User): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
      this._authHttp.get(environment.serverUrl + 'authent/merge?userId1=' + user1.id + '&userId2=' + user2.id)
        // .map((res: Response) => res.json().data as User[])
        .subscribe(
          (res: Response) => {
            resolve(res.json().data as User[]);
          },
          err => {
            reject(err);
          },
        );
    });
  }

  /**
   * Logout (just remove the JWT token)
   */
  logout() {
    localStorage.removeItem(AuthConfigConsts.DEFAULT_TOKEN_NAME);
    this.loggedIn = false;
    this.checkAuthent();
  }


  /**
   * Start logging process with facebook
   */
  startLoginFacebook() {
    // console.log("startLoginFacebook");
    const oAuthURL = `${environment.serverUrl}authent/facebook`;
    return this._startLoginOAuth(oAuthURL, LoginProvider.FACEBOOK);

  }

  /**
   * Start logging process with google
   */
  startLoginGoogle() {
    console.log('startLoginGoogle');
    const oAuthURL = `${environment.serverUrl}authent/google`;
    return this._startLoginOAuth(oAuthURL, LoginProvider.GOOGLE);

  }

  /**
   * Login with facebook code (and get a JWT token)
   * @param parsed
   * @returns {Promise<void>}
   */
  loginFacebook(parsed): Promise<User|string> {
    // console.log("loginFacebook "+code);
    return this._doGet(environment.serverUrl + 'authent/facebook/login?code=' + parsed.code);
  }

  /**
   * Login with google codes (and get a JWT token)
   * @param parsed
   * @returns {Promise<void>}
   */
  loginGoogle(parsed): Promise<User|string> {
    // console.log("loginGoogle "+code);
    return this._doGet(environment.serverUrl + 'authent/google/login?code=' + parsed.code);
  }

  /**
   * Unlink with facebook (and get a JWT token)
   * @param userId
   * @returns {Promise<void>}
   */
  unlinkFacebook(userId: string): Promise<User|string> {
    // console.log("unlinkFacebook ");
    return this._doGet(environment.serverUrl + 'authent/facebook/unlink?userId=' + userId);
  }

  /**
   * Unlink with google (and get a JWT token)
   * @param userId
   * @returns {Promise<void>}
   */
  unlinkGoogle(userId: string): Promise<User|string> {
    // console.log("unlinkGoogle ");
    return this._doGet(environment.serverUrl + 'authent/google/unlink?userId=' + userId);
  }


  /**
   * Post request for local authent
   * @param body
   * @param url
   * @returns {Promise<void>}
   * @private
   */
  private _doPost(body: string, url: string) {
    return new Promise<User>((resolve, reject) => {
      // depending on connected or not... use authHttp or simple http
      let usedHttp: (Http | AuthHttp) = this._http;
      if (this.checkAuthent(false)) {
        usedHttp = this._authHttp;
      }
      usedHttp
        .post(
          url,
          body,
          {
            headers: new Headers({
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            })
          }
        )
        // .timeout(10000)
        .toPromise()
        .then(res => {
          const data = res.json();
          // console.log(res.json());
          if (data[UserService.keyTokenId]) {
            localStorage.setItem(AuthConfigConsts.DEFAULT_TOKEN_NAME, data[UserService.keyTokenId]);
            this.loggedIn = true;
            this.checkAuthent();
            resolve();
          } else if (data['data']) {
            resolve(data['data'] as User);
          } else {
            reject();
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
   * Start logging process
   * @param oAuthURL
   * @param loginProvider
   * @returns {Promise<void>}
   * @private
   */
  private _startLoginOAuth(oAuthURL: string, loginProvider: LoginProvider) {
    const oAuthCalbackUrl = '/assets/logged.html';


    return new Promise<void>((resolve, reject) => {
      let loopCount = this.loopCount;
      this.windowHandle = WindowService.createWindow(oAuthURL, 'OAuth2 Login');

      this.intervalId = setInterval(() => {
        let parsed;
        if (loopCount-- < 0) {
          // Too many try... stop it
          clearInterval(this.intervalId);
          this.windowHandle.close();
          this.checkAuthent();
          console.error('Time out : close logging window');
          reject('Time out');
        } else {

          // Read th URL in the window
          let href: string;
          try {
            href = this.windowHandle.location.href;
          } catch (e) {
            console.log('Error:', e);
          }

          if (href != null) {

            // We got an answer...
            // console.log(href);

            // try to find the code
            const reSimple = /[?&](code|access_token)=(.*)/;
            const foundSimple = href.match(reSimple);

            if (foundSimple) {
              clearInterval(this.intervalId);
              this.windowHandle.close();

              parsed = this._parseQueryString(href.replace(new RegExp(`^.*${oAuthCalbackUrl}[?]`), ''));
              // console.log(parsed);

              if (parsed.code) {
                // we got the code... login
                if (loginProvider === LoginProvider.FACEBOOK) {
                  this.loginFacebook(parsed)
                    .then(() => {
                      resolve();
                    })
                    .catch(msg => {
                      this.checkAuthent();
                      reject(msg);
                    })
                } else {
                  this.loginGoogle(parsed)
                    .then(() => {
                      resolve();
                    })
                    .catch(msg => {
                      this.checkAuthent();
                      reject(msg);
                    })
                }
              } else {
                console.error('oAuth callback without and with code...?.. ' + href);
                this.checkAuthent();
                reject('login error');
              }

            } else {
              // http://localhost:3000/auth/callback#error=access_denied
              if (href.indexOf(oAuthCalbackUrl) > 0) {
                // If error
                clearInterval(this.intervalId);
                this.windowHandle.close();
                this.checkAuthent();

                parsed = this._parseQueryString(href.replace(new RegExp(`^.*${oAuthCalbackUrl}[?]`), ''));

                if (parsed.error_message) {
                  reject(parsed.error_message.replace(/[+]/g, ' '));
                } else {
                  reject('Login error');
                }
              }
            }
          }

        }
      }, this.intervalLength)
    })
  }


  /**
   * Perform the login (get after external popup)
   * @param authentUrl
   * @returns {Promise<void>}
   * @private
   */
  private _doGet(authentUrl: string) {
    return new Promise<User|string>((resolve, reject) => {
      // depending on connected or not... use authHttp or simple http
      let usedHttp: (Http | AuthHttp) = this._http;
      if (this.checkAuthent(false)) {
        usedHttp = this._authHttp;
      }
      usedHttp
        .get(
          authentUrl,
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
          // console.log(res.json());
          if (data[UserService.keyTokenId]) {
            localStorage.setItem(AuthConfigConsts.DEFAULT_TOKEN_NAME, data[UserService.keyTokenId]);
            this.loggedIn = true;
            this.checkAuthent();
            resolve();
          } else if (data['data']) {
            resolve(data['data'] as User);
          } else if (data['newPassword']) {
            resolve(data['newPassword'] as string);
          } else {
            resolve();
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
   * Parse a query string (lifted from https://github.com/sindresorhus/query-string)
   * @param str
   * @returns {{}}
   */
  private _parseQueryString(str) {
    // log("_parseQueryString : "+str);
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
