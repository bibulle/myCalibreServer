import {Component, OnInit} from '@angular/core';
import {Filter, FilterService} from '../../filter-bar/filter.service';
import {UserService} from '../user.service';
import {User} from '@my-calibre-server/api-interfaces';
import {Router} from '@angular/router';

@Component({
    selector: 'my-calibre-server-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: false
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

  /**
   * Change pawwsord
   */
   changepw() {
    this._router.navigate(['/changepassword'])
  }

  isAdmin(): boolean {
    return this._userService.isUserAdmin();
  }

  /**
   * Open the administration (users list) page - only reachable from here,
   * not from the main nav, per the "Reliure" design.
   */
  openAdmin() {
    this._router.navigate(['/users']);
  }

  goLibrary() {
    this._router.navigate(['/home']);
  }

  /**
   * One or two initials shown in the identity banner avatar.
   */
  initials(): string {
    const { firstname, lastname, username } = this.user.local ?? {};
    if (firstname || lastname) {
      return `${(firstname ?? '').charAt(0)}${(lastname ?? '').charAt(0)}`.toUpperCase();
    }
    return (username ?? '').charAt(0).toUpperCase();
  }

  displayName(): string {
    const { firstname, lastname, username } = this.user.local ?? {};
    if (firstname || lastname) {
      return `${firstname ?? ''} ${lastname ?? ''}`.trim();
    }
    return username ?? '';
  }

}
