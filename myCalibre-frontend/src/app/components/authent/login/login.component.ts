import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {Filter, FilterService} from "../../filter-bar/filter.service";
import {UserService} from "../user.service";
import {NotificationService} from "../../notification/notification.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _notificationService: NotificationService,
              private _router: Router) {
  }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));
  }

  login(event, username, password) {
    event.preventDefault();

    this._userService.logout();
    this._userService.login(username, password)
      .then(() => {
        this._router.navigate(['home']);
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

  startLoginFacebook() {
    event.preventDefault();

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
    event.preventDefault();

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
