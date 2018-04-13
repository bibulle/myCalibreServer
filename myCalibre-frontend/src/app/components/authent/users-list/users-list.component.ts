import {Component, NgModule, OnInit} from '@angular/core';
import {User} from '../user';
import {UserService} from '../user.service';
import {NotificationService} from '../../notification/notification.service';
import {Filter, FilterService} from '../../filter-bar/filter.service';
import {UserListItemComponent, UserListItemModule} from './user-list-item/user-list-item.component';
import {FormsModule} from '@angular/forms';
import {MatButtonModule, MatCardModule, MatCommonModule, MatIconModule, MatInputModule, MatToolbarModule} from '@angular/material';
import {CommonModule} from '@angular/common';
import {MatContentModule} from '../../content/content.component';
import {FlexLayoutModule} from '@angular/flex-layout';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  users: User[];

  selectedMergeUser: User;

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
        })
        .catch(err => {
          console.log(err);
          this._notificationService.error(err.statusText);
        });
    }
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
    FlexLayoutModule
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
export class UsersListModule { }
