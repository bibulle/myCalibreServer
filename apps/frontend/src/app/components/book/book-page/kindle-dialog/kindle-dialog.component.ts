import { Component, OnInit, Optional } from '@angular/core';
import { UserService } from '../../../authent/user.service';
import { User } from '@my-calibre-server/api-interfaces';
import { MatDialogRef } from '@angular/material/dialog';

export class KindleDialogReturn {
  mail = '';
}

@Component({
  selector: 'my-calibre-server-kindle-dialog',
  templateUrl: './kindle-dialog.component.html',
  styleUrls: ['./kindle-dialog.component.scss'],
})
export class KindleDialogComponent implements OnInit {
  user: User = {} as User;
  filteredMails: string[] = [];

  mail = '';

  constructor(@Optional() public dialogRef: MatDialogRef<KindleDialogComponent>, private _userService: UserService) {}

  ngOnInit() {
    this.user = this._userService.getUser();
    this.mailFilter();
  }

  async send() {
    // Add book to list if not exists
    if (!this.user.local.amazonEmails) {
      this.user.local.amazonEmails = [];
    }
    const found = this.user.local.amazonEmails.filter((el) => {
      return el.trim() === this.mail;
    });
    if (found.length === 0) {
      this.user.local.amazonEmails.push(this.mail);
      //noinspection JSIgnoredPromiseFromCall
      await this._userService.save(this.user);
    }
    const ret : KindleDialogReturn = {
      mail: this.mail
    } 

    this.dialogRef.close(ret);
  }

  cancel() {
    this.dialogRef.close();
  }

  mailFilter() {
    if (!this.user || !this.user.local || !this.user.local.amazonEmails) {
      return;
    }
    if (this.mail) {
      this.filteredMails = this.user.local.amazonEmails.filter((s) => new RegExp(`^${this.mail}`, 'gi').test(s));
    } else {
      this.filteredMails = this.user.local.amazonEmails;
    }
  }
}
