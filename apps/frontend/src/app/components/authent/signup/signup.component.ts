import {Component, OnInit} from '@angular/core';
import {FilterService, Filter} from '../../filter-bar/filter.service';
import {UserService} from '../user.service';
import {Router} from '@angular/router';
import {NotificationService} from '../../notification/notification.service';
import {TitleService} from '../../../app/title.service';
import {Version} from '@my-calibre-server/api-interfaces';

@Component({
    selector: 'my-calibre-server-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    standalone: false
})
export class SignupComponent implements OnInit {

  version: Version = new Version();

  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _notificationService: NotificationService,
              private _titleService: TitleService,
              private _router: Router) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._titleService.getVersion().then((v) => {
      this.version = v;
    });
  }

  isVersionBeta(): boolean {
    return this.version.version.startsWith('0.');
  }

  signup(event: Event, username:string, password:string, firstname:string, lastname:string, email:string) {
    event.preventDefault();


    this._userService.signup(username, password, firstname, lastname, email)
      .then(() => {
        this._router.navigate(['home']);
      })
      .catch( (err) => {
        this._notificationService.error(err);
      });
  }

  login() {
    this._router.navigate(['/login']);
  }

}
