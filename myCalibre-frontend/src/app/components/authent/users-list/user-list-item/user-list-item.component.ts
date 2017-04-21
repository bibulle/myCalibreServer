import {Component, EventEmitter, Input, NgModule, OnInit, Output} from "@angular/core";
import {User} from "../../user";
import {CommonModule} from "@angular/common";
import {MdButtonModule, MdCardModule, MdCheckboxModule, MdIconModule, MdInputModule, MdSlideToggleModule} from "@angular/material";
import {FormsModule} from "@angular/forms";
import {UserProfileComponent, UserProfileModule} from "../../profile/user-profile/user-profile.component";
import {NotificationService} from "app/components/notification/notification.service";
import {UserService} from "../../user.service";

@Component({
  selector: 'app-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss']
})
export class UserListItemComponent implements OnInit {

  @Input()
  user: User;

  @Output()
  listChanged:EventEmitter<string> = new EventEmitter();

  userClosed = true;


  constructor(private _userService: UserService,
              private _notificationService: NotificationService) { }

  ngOnInit() {
  }

  toggleUserClosed () {
    //console.log("toggle");
    this.userClosed = !this.userClosed;
  }

  remove() {
    this._userService.remove(this.user)
      .then(() => {
        this.listChanged.emit("user deleted");
      })
      .catch(err => {
        console.log(err);
        this._notificationService.error(err.statusText || err);
      });


  }

}

@NgModule({
  imports: [
    CommonModule,
    MdButtonModule,
    MdCardModule,
    MdIconModule,
    MdSlideToggleModule,
    MdCheckboxModule,
    FormsModule,
    MdInputModule,
    UserProfileModule
  ],
  declarations: [
    UserListItemComponent
  ],
  exports: [
    UserListItemComponent
  ]
})
export class UserListItemModule {
}
