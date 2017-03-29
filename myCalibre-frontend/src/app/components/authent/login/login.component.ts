import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Filter, FilterService} from "../../filter-bar/filter.service";
import {UserService} from "../user.service";
import {NotificationService} from "../../notification/notification.service";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {


  facebookUrlBase = `${environment.serverUrl}authent/facebook`;

  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _notificationService: NotificationService,
              private _router: Router,
              private _route: ActivatedRoute) {
  }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    // Search for params (if we go a code we come from facebook)
    this._route.queryParams.forEach((params: Params) => {
      if (params['code']) {
        this._userService.loginFacebook(params['code'])
          .then(() => {
            this._router.navigate(['home']);
          })
          .catch((err) => {
            this._notificationService.error(err);
          });
      }
    });


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

  signup() {
    this._router.navigate(['signup']);
  }

}
