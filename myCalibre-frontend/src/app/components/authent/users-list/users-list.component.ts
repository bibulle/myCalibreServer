import {Component, NgModule, OnInit} from '@angular/core';
import {User} from '../user';
import {UserService} from '../user.service';
import {NotificationService} from '../../notification/notification.service';
import {Filter, FilterService, SortingDirection} from '../../filter-bar/filter.service';
import {UserListItemModule} from './user-list-item/user-list-item.component';
import {FormsModule} from '@angular/forms';
import {MatButtonModule, MatCardModule, MatCommonModule, MatIconModule, MatInputModule, MatToolbarModule} from '@angular/material';
import {CommonModule} from '@angular/common';
import {MatContentModule} from '../../content/content.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  SortType = {
    UserName: 0,
    FirstName: 1,
    LastName: 2,
    Mail: 3,
    LastActionDate: 4,
    DownloadCount: 5,
    IsAdmin: 6,
    LoginLocal: 7,
    LoginFacebook: 8,
    LoginGoogle: 9
  };
  SortingDirection = {
    Asc: 0, Desc: 1
  };

  users: User[];

  selectedMergeUser: User;

  sort = this.SortType.LastActionDate;
  sort_direction = this.SortingDirection.Desc;

  static s(s: string) {
    return (s ? s : 'ZZZZZZZZZZZZZZZZZZZZZZZZZ');
  }

  static d(d: Date) {
    return (d ? d : '1900-00-00');
  }

  static n(n: Number) {
    let s = '00000000' + (n ? n : '0');
    return s.substr(s.length - 9);
  }

  constructor(private _userService: UserService,
              private _notificationService: NotificationService,
              private _filterService: FilterService) {
  }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));
    this.loadUsers();

  }

  loadUsers() {
    this._userService.getAll()
      .then(users => {
        this.selectedMergeUser = null;
        this.users = users;
        this.sortList();
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText);
      });
  }

  mergeUsers(user: User) {
    if (!this.selectedMergeUser) {
      this.selectedMergeUser = user;
    } else if (this.selectedMergeUser === user) {
      this.selectedMergeUser = null;
    } else {
      this._userService.merge(this.selectedMergeUser, user)
        .then(users => {
          this.selectedMergeUser = null;
          this.users = users;
          this.sortList();
        })
        .catch(err => {
          console.log(err);
          this._notificationService.error(err.statusText);
        });
    }
  }

  toggleSort(sortType) {
    if (this.sort === sortType) {
      this.sort_direction = (this.sort_direction + 1) % 2;
    } else {
      this.sort = sortType;
      this.sort_direction = this.SortingDirection.Asc;
    }
    this.sortList();
  }

  sortList() {
    this.selectedMergeUser = null;
    this.users = this.users
      .sort((u1, u2) => {
        let v1: string;
        let v2: string;

        v1 = UsersListComponent.s(u1.local.username) + u1.local.lastname + u1.local.firstname;
        v2 = UsersListComponent.s(u2.local.username) + u2.local.lastname + u2.local.firstname;
        switch (this.sort) {
          case this.SortType.UserName:
            break;
          case this.SortType.FirstName:
            v1 = u1.local.firstname + v1;
            v2 = u2.local.firstname + v2;
            break;
          case this.SortType.LastName:
            v1 = u1.local.lastname + v1;
            v2 = u2.local.lastname + v2;
            break;
          case this.SortType.Mail:
            v1 = u1.local.email + v1;
            v2 = u2.local.email + v2;
            break;
          case this.SortType.LastActionDate:
            v1 = UsersListComponent.d(u1.history.lastConnection) + v1;
            v2 = UsersListComponent.d(u2.history.lastConnection) + v2;
            break;
          case this.SortType.DownloadCount:
            v1 = UsersListComponent.n(u1.history.downloadedBooks.length) + v1;
            v2 = UsersListComponent.n(u2.history.downloadedBooks.length) + v2;
            break;
          case this.SortType.IsAdmin:
            v1 = u1.local.isAdmin + v1;
            v2 = u2.local.isAdmin + v2;
            break;
          case this.SortType.LoginLocal:
            v1 = UsersListComponent.s(u1.local.username) + v1;
            v2 = UsersListComponent.s(u2.local.username) + v2;
            break;
          case this.SortType.LoginFacebook:
            v1 = UsersListComponent.s(u1.facebook.name) + v1;
            v2 = UsersListComponent.s(u2.facebook.name) + v2;
            break;
          case this.SortType.LoginGoogle:
            v1 = UsersListComponent.s(u1.google.name) + v1;
            v2 = UsersListComponent.s(u2.google.name) + v2;
            break;
        }

        switch (this.sort_direction) {
          case SortingDirection.Asc:
            return v1.localeCompare(v2);
          case SortingDirection.Desc:
          default:
            return v2.localeCompare(v1);
        }

      });
  }


}


@NgModule({
  imports: [
    FormsModule,
    MatCommonModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatContentModule,
    MatToolbarModule,
    UserListItemModule,
    FlexLayoutModule,
    TranslateModule
    // MatInputModule,
    // FlexModule,
    // ScrollDetectorModule,
  ],
  declarations: [
    UsersListComponent
  ],
  exports: [
    UsersListComponent
  ]
})
export class UsersListModule {
}
