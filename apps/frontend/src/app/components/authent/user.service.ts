import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiReturn, User, UserAPI } from '@my-calibre-server/api-interfaces';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { WindowService } from '../../core/util/window.service';

enum LoginProvider {
  FACEBOOK,
  GOOGLE,
}

@Injectable()
export class UserService {
  private static KEY_TOKEN_LOCAL_STORAGE = 'id_token';

  private loggedIn = false;

  private userSubject: BehaviorSubject<User>;

  private user = {} as User;
  private jwtHelper: JwtHelperService = new JwtHelperService();

  private loopCount = 600;
  private intervalLength = 100;

  private windowHandle: Window | null = null;
  private intervalId: ReturnType<typeof setTimeout> | null = null;

  constructor(private _http: HttpClient) {
    this.loggedIn = !!UserService.tokenGetter();

    this.userSubject = new BehaviorSubject<User>(this.user);

    const timer1 = timer(3 * 1000, 3 * 1000);
    timer1.subscribe(() => {
      this.checkAuthent();
    });
  }

  //-------------------------------------------------------
  // manage token
  //-------------------------------------------------------
  /**
   * Get token from local storage
   * @returns {string | null}
   */
  public static tokenGetter() {
    return localStorage.getItem(UserService.KEY_TOKEN_LOCAL_STORAGE);
  }

  /**
   * Set token to local storage
   * @param {string | null} token
   */
  public tokenSetter(token: string | null) {
    if (token) {
      localStorage.setItem(UserService.KEY_TOKEN_LOCAL_STORAGE, token);
    }
  }

  /**
   * Remove token from local storage
   */
  public tokenRemove() {
    localStorage.removeItem(UserService.KEY_TOKEN_LOCAL_STORAGE);
  }

  /**
   * get user message from error
   * @param error
   * @returns string
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getMSgFromError(error: any): string {
    console.error(error);
    // Try to get the content
    try {
      // const data = error.json();
      const data = error;
      if (data && data.error) {
        if (data.error instanceof Array) {
          error = data.error[data.error.length - 1];
        } else if (data.error.message) {
          error = data.error;
        } else {
          error = data.error;
        }
      }
    } catch (er) {
      console.error(er);
    }

    return error.statusText || error.message || error || 'Connection error';
  }

  /**
   * Get the observable on user changes
   * @returns {Observable<User>}
   */
  userObservable(): Observable<User> {
    return this.userSubject.pipe(
      distinctUntilChanged((a, b) => {
        // console.log(JSON.stringify(a.local));
        // console.log(JSON.stringify(b.local));
        return JSON.stringify(a) === JSON.stringify(b);
      })
    );
  }

  /**
   * Check authentication locally (is the jwt not expired)
   * @returns {boolean} are we authenticate
   */
  checkAuthent(emitEvent = true): boolean {
    // console.log('checkAuthent');
    let ret = false;

    const jwt = UserService.tokenGetter();

    const oldUser = this.user;

    if (!jwt || this.jwtHelper.isTokenExpired(jwt)) {
      this.user = {} as User;
    } else {
      this.user = this.jwtHelper.decodeToken(jwt) as User;
      ret = true;
    }

    // if it's a new user, refresh it (to complete the token) else recall last complement
    if (this.user && this.user.id && this.user.id !== oldUser.id) {
      this.refreshUser();
    } else {
      if (this.user.history && oldUser.history) {
        this.user.history.downloadedBooks = oldUser.history.downloadedBooks;
        this.user.history.ratings = oldUser.history.ratings;
      }
    }

    // console.log(this.user);

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
   * Is logged ?
   */
  isAuthent(): boolean {
    this.checkAuthent();

    return !!(this.user && this.user.id);
  }

  /**
   * Is the logged user admin
   * @returns {boolean}
   */
  isUserAdmin(): boolean {
    this.checkAuthent();
    return this.user && this.user.local && this.user.local.isAdmin === true;
    // return true;
  }
  setUserAdmin(user: User, isAdmin: boolean): Promise<UserAPI> {
    user.local.isAdmin = isAdmin;
    return this.save(user);
  }

  /**
   * Login (and get a JWT token)
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  login(username: string, password: string): Promise<User> {
    const body = JSON.stringify({ username, password });

    return this._doPost(body, '/api/authent/login');
  }

  /**
   * Refresh the JWT token (if user is updated)
   * @returns {Promise<void>}
   */
  refreshUser(): Promise<User | string> {
    console.log('refreshUser');
    return new Promise<User>((resolve, reject) => {
      this._http
        .get<ApiReturn>('/api/users/me')
        // .map((res: Response) => res.json().data as User[])
        .subscribe({
          next: (data) => {
            const user = data.user;
            if (user && user.id) {
              this.user = user;
              this.userSubject.next(this.user);
              resolve(this.user);
            } else {
              console.error(data);
              reject('Cannot read user');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * Connect Local
   * @param username
   * @param password
   * @returns {Promise<void>}
   */
  connectLocal(username: string, password: string): Promise<User> {
    const body = JSON.stringify({ username, password });

    return this._doPost(body, '/api/authent/connect/local');
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
  signup(username: string, password: string, firstname: string, lastname: string, email: string): Promise<User> {
    const body = JSON.stringify({
      username,
      password,
      firstname,
      lastname,
      email,
    });

    return this._doPost(body, '/api/authent/signup');
  }

  /**
   * Save a user
   * @param user
   * @returns {Promise<User>}
   */
  save(user: User): Promise<UserAPI> {
    return new Promise<UserAPI>((resolve, reject) => {
      const body = JSON.stringify({ user });

      this._http
        .post<ApiReturn>('/api/users/save', body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (ret) => {
            if (ret.user) {
              resolve(ret.user);
            } else {
              reject('Cannot save te user');
            }
          },
          error: (err) => {
            console.error(err);
            reject(this._getMSgFromError(err));
          },
        });
    });
  }

  /**
   * Delete a user
   * @param user
   * @returns {Promise<User>}
   */
  remove(user: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const body = JSON.stringify({ userId: user.id });

      this._http
        .post<ApiReturn>('/api/users/delete', body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: () => {
            resolve();
          },
          error: (err) => {
            console.error(err);
            reject(this._getMSgFromError(err));
          },
        });
    });
  }

  /**
   * Reset a password
   * @param user
   * @returns {Promise<string>}
   */
  resetPassword(user: User): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const body = JSON.stringify({ userId: user.id });

      this._http
        .post<ApiReturn>('/api/users/reset', body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (ret) => {
            if (ret.newPassword) {
              resolve(ret.newPassword);
            } else {
              reject("no new password");
            }
          },
          error: (err) => {
            console.error(err);
            reject(this._getMSgFromError(err));
          },
        });
    });
  }
   /**
   * ChangePassword
   * @param password
   * @returns {Promise<void>}
   */
    changePassword(password: string): Promise<User> {
      const body = JSON.stringify({
        password,
      });
  
      return this._doPost(body, '/api/users/changepw');
    }

  /**
   * Get all users
   * @returns {Promise<User[]>}
   */
  getAll(): Promise<UserAPI[]> {
    return new Promise<UserAPI[]>((resolve, reject) => {
      this._http
        .get<ApiReturn>('/api/users')
        // .map((res: Response) => res.json().data as User[])
        .subscribe({
          next: (data) => {
            if (data && data.users) {
              resolve(data.users);
            } else {
              console.error(data);
              reject('Cannot get users');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * Merge two users
   * @returns {Promise<User[]>}
   */
  merge(user1: User, user2: User): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
      const body = JSON.stringify({ 
        userSrcId: user1.id, 
        userTrgId: user2.id 
      });

      this._http
      .post<ApiReturn>('/api/users/merge', body, {
        headers: new HttpHeaders({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
      })
      .subscribe({
          next: (data) => {
            if (data && data.users) {
              resolve(data.users);
            } else {
              console.error(data);
              reject('Cannot merge user');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * Logout (just remove the JWT token)
   */
  logout() {
    this.tokenRemove();
    this.loggedIn = false;
    this.checkAuthent();
  }

  /**
   * Start logging process with facebook
   */
  startLoginFacebook() {
    // console.log("startLoginFacebook");
    const oAuthURL = `/api/authent/facebook`;
    return this._startLoginOAuth(oAuthURL, LoginProvider.FACEBOOK);
  }

  /**
   * Start logging process with google
   */
  startLoginGoogle() {
    // console.log('startLoginGoogle');
    const oAuthURL = `/api/authent/google`;
    return this._startLoginOAuth(oAuthURL, LoginProvider.GOOGLE);
  }

  /**
   * Login with facebook code (and get a JWT token)
   * @param parsed
   * @returns {Promise<void>}
   */
  loginFacebook(parsed: { code: string }): Promise<User | string> {
    // console.log("loginFacebook "+code);
    return this._doGet('/api/authent/facebook/callback?code=' + parsed.code);
  }

  /**
   * Login with google codes (and get a JWT token)
   * @param parsed
   * @returns {Promise<void>}
   */
  loginGoogle(parsed: { code: string }): Promise<User | string> {
    // console.log("loginGoogle "+code);
    return this._doGet('/api/authent/google/callback?code=' + parsed.code);
  }

  /**
   * Unlink with facebook (and get a JWT token)
   * @param userId
   * @returns {Promise<void>}
   */
  unlinkFacebook(userId: string | undefined): Promise<User | string> {
    // console.log("unlinkFacebook ");
    return this._doGet('/api/authent/facebook/unlink?userId=' + userId);
  }

  /**
   * Unlink with google (and get a JWT token)
   * @param userId
   * @returns {Promise<void>}
   */
  unlinkGoogle(userId: string | undefined): Promise<UserAPI> {
    // console.log("unlinkGoogle ");
    return new Promise<UserAPI>((resolve, reject) => {
      this._http
        .get<ApiReturn>(`/api/authent/google/unlink?userId=${userId}`)
        // .map((res: Response) => res.json().data as User[])
        .subscribe({
          next: (data) => {
            if (data && data.user) {
              if (data.id_token) {
                this.tokenSetter(data.id_token);
                this.checkAuthent();
              }
              resolve(data.user);
            } else {
              console.error(data);
              reject('Cannot get users');
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * Post request for local authent
   * @param body
   * @param url
   * @returns {Promise<void>}
   * @private
   */
  private _doPost(body: string, url: string) {
    return new Promise<UserAPI>((resolve, reject) => {
      this._http
        .post<ApiReturn>(url, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            //console.log(data);
            // const data = res.json();
            // console.log(res.json());
            if (data && data.id_token) {
              this.tokenSetter(data.id_token);
              this.loggedIn = true;
              this.checkAuthent();
              resolve(this.getUser());
            } else if (data.user) {
              resolve(data.user);
            } else {
              console.error(`Wrong data received from API (${url})->"${JSON.stringify(data)}"`);
              reject();
            }
          },
          error: (error) => {
            this.checkAuthent();

            const msg = this._getMSgFromError(error);
            reject(msg);
          },
        });
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
    const oAuthCallbackUrl = '/assets/logged.html';

    return new Promise<void>((resolve, reject) => {
      let loopCount = this.loopCount;
      this.windowHandle = WindowService.createWindow(oAuthURL, 'OAuth2 Login');

      this.intervalId = setInterval(() => {
        let parsed;
        if (loopCount-- < 0) {
          // Too many try... stop it
          if (this.intervalId) {
            clearInterval(this.intervalId);
          }
          if (this.windowHandle) {
            this.windowHandle.close();
          }
          this.checkAuthent();
          console.error('Time out : close logging window');
          reject('Time out');
        } else {
          // Read th URL in the window
          let href: string | null = null;
          try {
            if (this.windowHandle) {
              href = this.windowHandle.location.href;
            }
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
              if (this.intervalId) {
                clearInterval(this.intervalId);
              }
              if (this.windowHandle) {
                this.windowHandle.close();
              }

              parsed = this._parseQueryString(href.replace(new RegExp(`^.*${oAuthCallbackUrl}[?]`), ''));
              // console.log(parsed);

              if (parsed.code) {
                // we got the code... login
                if (loginProvider === LoginProvider.FACEBOOK) {
                  this.loginFacebook(parsed)
                    .then(() => {
                      resolve();
                    })
                    .catch((msg) => {
                      this.checkAuthent();
                      reject(msg);
                    });
                } else {
                  this.loginGoogle(parsed)
                    .then(() => {
                      resolve();
                    })
                    .catch((msg) => {
                      this.checkAuthent();
                      reject(msg);
                    });
                }
              } else {
                console.error('oAuth callback without and with code...?.. ' + href);
                this.checkAuthent();
                reject('login error');
              }
            } else {
              // http://localhost:3000/auth/callback#error=access_denied
              if (href.indexOf(oAuthCallbackUrl) > 0) {
                // If error
                if (this.intervalId) {
                  clearInterval(this.intervalId);
                }
                if (this.windowHandle) {
                  this.windowHandle.close();
                }
                this.checkAuthent();

                parsed = this._parseQueryString(href.replace(new RegExp(`^.*${oAuthCallbackUrl}[?]`), ''));

                if (parsed.error_message) {
                  reject(parsed.error_message.replace(/[+]/g, ' '));
                } else {
                  reject('Login error');
                }
              }
            }
          }
        }
      }, this.intervalLength);
    });
  }

  /**
   * Perform the login (get after external popup)
   * @param authentUrl
   * @returns {Promise<void>}
   * @private
   */
  private _doGet(authentUrl: string) {
    return new Promise<User | string>((resolve, reject) => {
      this._http
        .get<ApiReturn>(authentUrl, {
          headers: new HttpHeaders({
            Accept: 'application/json',
          }),
        })
        .subscribe({
          next: (data: ApiReturn) => {
            // const data = res.json();
            // console.log(res.json());
            if (data.id_token) {
              this.tokenSetter(data.id_token);
              this.loggedIn = true;
              this.checkAuthent();
              resolve(this.getUser());
            } else if (data.user) {
              resolve(data.user);
              // } else if (data['newPassword']) {
              //   resolve(data['newPassword'] as string);
            } else {
              resolve('');
            }
          },
          error: (error) => {
            this.checkAuthent();

            const msg = this._getMSgFromError(error);
            reject(msg);
          },
        });
    });
  }

  /**
   * Parse a query string (lifted from https://github.com/sindresorhus/query-string)
   * @param str
   * @returns {{}}
   */
  private _parseQueryString(str: string) {
    // log("_parseQueryString : "+str);
    if (typeof str !== 'string') {
      return {};
    }

    str = str.trim().replace(/^[?#&]/, '');

    if (!str) {
      return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return str.split('&').reduce(function (ret: any, param) {
      const parts = param.replace(/[+]/g, ' ').split('=');
      // Firefox (pre 40) decodes `%3D` to `=`
      // https://github.com/sindresorhus/query-string/pull/37
      let key = parts.shift();
      let val: string | null | undefined = parts.length > 0 ? parts.join('=') : undefined;

      if (key) {
        key = decodeURIComponent(key);

        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);

        if (!Object.prototype.hasOwnProperty.call(ret, key)) {
          ret[key] = val;
        } else if (Array.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
      }

      return ret;
    }, {});
  }
}
