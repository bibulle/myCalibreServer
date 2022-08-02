import {Component, OnInit} from '@angular/core';
import {Filter, FilterService} from '../../filter-bar/filter.service';
import {UserService} from '../user.service';
import {User} from '@my-calibre-server/api-interfaces';
import {Router} from '@angular/router';

@Component({
  selector: 'my-calibre-server-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: User = {} as User;



  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _router: Router) {
  }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._userService.checkAuthent();

    // get user change from elsewhere
    this._userService.userObservable().subscribe(
      user => {
        // console.log(user);
        this.user = user;
      });


  }

  /**
   * Logout
   */
  logout() {
    this._userService.logout();
    this._router.navigate(['/home'])
  }

}
