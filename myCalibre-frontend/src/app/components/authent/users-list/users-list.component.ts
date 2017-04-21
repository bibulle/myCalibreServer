import {Component, NgModule, OnInit} from '@angular/core';
import {User} from "../user";
import {UserService} from "../user.service";
import {NotificationService} from "../../notification/notification.service";
import {Filter, FilterService} from "../../filter-bar/filter.service";
import {UserListItemComponent, UserListItemModule} from "./user-list-item/user-list-item.component";
import {FormsModule} from "@angular/forms";
import {MdButtonModule, MdCardModule, MdCoreModule, MdIconModule, MdInputModule, MdToolbarModule} from "@angular/material";
import {CommonModule} from "@angular/common";
import {MdContentModule} from "../../content/content.component";

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  users: User[];

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
        this.users = users;
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText);
      });
  }

}

@NgModule({
  imports: [
    FormsModule,
    MdCoreModule,
    CommonModule,
    MdCardModule,
    MdButtonModule,
    MdIconModule.forRoot(),
    MdInputModule,
    MdContentModule,
    MdToolbarModule,
    UserListItemModule
    // MdInputModule,
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
