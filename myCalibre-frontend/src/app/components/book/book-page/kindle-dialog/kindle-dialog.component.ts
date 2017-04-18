import { Component, OnInit, Optional } from '@angular/core';
import { MdDialogRef } from "@angular/material";
import {UserService} from "../../../authent/user.service";
import {User} from "../../../authent/user";

@Component({
  selector: 'app-kindle-dialog',
  templateUrl: './kindle-dialog.component.html',
  styleUrls: ['./kindle-dialog.component.scss'],
})
export class KindleDialogComponent implements OnInit {


  user: User = new User({});
  filteredMails: String[];

  mail: string = "";


  constructor(@Optional() public dialogRef: MdDialogRef<KindleDialogComponent>,
              private _userService: UserService) { }

  ngOnInit() {
    this.user = this._userService.getUser();
    this.mailFilter();
  }

  send() {
    // Add book to list if not exists
    const found = this.user.local.amazonEmails.filter(el => {
      return el.trim() === this.mail;
    });
    if (found.length == 0) {
      this.user.local.amazonEmails.push(this.mail);
      //noinspection JSIgnoredPromiseFromCall
      this._userService.save(this.user);
    }

    this.dialogRef.close(this.mail);
  }

  cancel() {
    this.dialogRef.close();
  }


  mailFilter() {
    if (!this.user || !this.user.local || !this.user.local.amazonEmails) {
      return [];
    }
    if (this.mail) {
      this.filteredMails = this.user.local.amazonEmails.filter(s => new RegExp(`^${this.mail}`, 'gi').test(s))
    } else {
      this.filteredMails = this.user.local.amazonEmails
    }
  }
}
