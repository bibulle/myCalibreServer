import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Version } from '@my-calibre-server/api-interfaces';
import { Filter, FilterService } from '../../filter-bar/filter.service';
import { NotificationService } from '../../notification/notification.service';
import { TitleService } from '../../../app/title.service';
import { UserService } from '../user.service';

@Component({
    selector: 'my-calibre-server-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoginComponent implements OnInit {

  version: Version = new Version();

  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _notificationService: NotificationService,
              private _titleService: TitleService,
              private _router: Router) {
  }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._titleService.getVersion().then((v) => {
      this.version = v;
    });
  }

  isVersionBeta(): boolean {
    return this.version.version.startsWith('0.');
  }

  login(event: Event, username:string, password:string) {
    event.preventDefault();

    this._userService.logout();
    this._userService.login(username, password)
      .then(() => {
        this._router.navigate(['/home']);
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

  startLoginFacebook() {
    event?.preventDefault();

    this._userService.logout();
    this._userService.startLoginFacebook()
      .then(() => {
        this._router.navigate(['home']);
      })
      .catch((err) => {
        this._notificationService.error(err);
      });

  }

  startLoginGoogle() {
    event?.preventDefault();

    this._userService.logout();
    this._userService.startLoginGoogle()
      .then(() => {
        this._router.navigate(['home']);
      })
      .catch((err) => {
        this._notificationService.error(err);
      });

  }

  signup() {
    this._router.navigate(['signup']);
  }

}
