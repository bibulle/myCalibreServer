import { CommonModule } from '@angular/common';
import { Component, Input, NgModule, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { User } from '@my-calibre-server/api-interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LocalizedDateModule } from '../../../../directives/localized-date.pipe';
import { NotificationService } from '../../../notification/notification.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'my-calibre-server-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit, OnChanges {
  @Input()
  user: User = {} as User;

  @Input()
  urlToRedirect = '/profile';

  amazonEmail: string | undefined;

  oldUserJson = '';

  // The queue to manage user choices
  private subjectUser: Subject<User> | undefined;

  constructor(private _userService: UserService, private _notificationService: NotificationService, private _router: Router) {}

  ngOnInit() {
    // ----------
    // Save user choice changes to Db
    // ----------
    if (!this.subjectUser) {
      this.subjectUser = new Subject<User>();
      this.subjectUser.pipe(debounceTime(500)).subscribe({
        next: (user) => {
          // console.log(user);
          return this._userService
            .save(user)
            .then((newUser) => {
              if (!newUser) {
                this._userService.checkAuthent();
                this._notificationService.message('All your modifications have been saved...');
              } else {
                this.user = newUser;
                this._notificationService.message('All your modifications have been saved...');
              }
            })
            .catch((error) => {
              console.error(error);
              if (error) {
                this._notificationService.error('Error saving you changes !!\n\t' + (error.message || error));
              } else {
                this._notificationService.error('Error saving you changes !!');
              }
            });
        },
        error: (error) => {
          console.error(error);
        },
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user']) {
      this.oldUserJson = JSON.stringify(this.user);
      // console.log(this.oldUserJson);
    }
  }

  /**
   * Save user changes
   */
  userChange() {
    console.log("userChange")
    if (this.oldUserJson === JSON.stringify(this.user)) {
      return;
    }

    this.oldUserJson = JSON.stringify(this.user);

    if (this.user && this.subjectUser) {
      this.subjectUser.next(this.user);
    }
  }

  /**
   * Add an email to the list
   */
  addEmail() {
    if (this.user && (!this.user.local || !this.user.local.amazonEmails)) {
      this.user.local.amazonEmails = [];
    }

    if (!this.amazonEmail || this.amazonEmail.trim() === '') {
      return;
    }
    this.amazonEmail = this.amazonEmail.trim();

    if (this.user.local.amazonEmails) {
      const found = this.user.local.amazonEmails.filter((el) => {
        return el.trim() === this.amazonEmail;
      });
      if (this.user && found && found.length === 0) {
        this.user.local.amazonEmails.push(this.amazonEmail);
        this.amazonEmail = undefined;
      }

      this.userChange();
    }
  }

  /**
   * Del an email to the list
   */
  delEmail(email: string) {
    if (this && this.user) {
      if (this.user.local && !this.user.local.amazonEmails) {
        this.user.local.amazonEmails = [];
      }

      if (this.user.local.amazonEmails) {
        this.user.local.amazonEmails = this.user.local.amazonEmails.filter((el) => {
          return el.trim() !== email.trim();
        });
      }

      this.userChange();
    }
  }

  /**
   * Connect locally (with user/password)
   */
  // connectLocal() {
  //   this._router.navigate(['/connect/local']);
  // }

  /**
   * Connect with facebook
   */
  connectFacebook() {
    event?.preventDefault();

    if (this.user?.id !== this._userService.getUser().id) {
      return this._notificationService.error('Not allowed');
    }

    this._userService
      .startLoginFacebook()
      .then(() => {
        this._router.navigate([this.urlToRedirect]);
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

  /**
   * Connect with google
   */
  connectGoogle() {
    event?.preventDefault();

    if (this.user?.id !== this._userService.getUser().id) {
      return this._notificationService.error('Not allowed');
    }

    this._userService
      .startLoginGoogle()
      .then(() => {
        this._router.navigate([this.urlToRedirect]);
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

  /**
   * Unlink with facebook
   */
  unlinkFacebook() {
    event?.preventDefault();

    this._userService
      .unlinkFacebook(this.user?.id)
      .then((user) => {
        if (this.user && this.user.id !== this._userService.getUser().id) {
          if (typeof user !== 'string') {
            this.user.facebook = user['facebook'];
          }
        } else {
          this._router.navigate([this.urlToRedirect]);
        }
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

  /**
   * Unlink with google
   */
  unlinkGoogle() {
    event?.preventDefault();

    this._userService
      .unlinkGoogle(this.user?.id)
      .then((user) => {
        console.log(user);
        if (this.user && this.user.id !== this._userService.getUser().id) {
          if (typeof user !== 'string') {
            this.user.google = user['google'];
          }
        } else {
          this._router.navigate([this.urlToRedirect]);
        }
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

  /**
   * A book has been clicked
   * @param bookId
   */
  openBook(bookId: number) {
    this._router.navigate(['/book', bookId]);
  }
}

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatInputModule,
    MatTooltipModule,
    TranslateModule,
    LocalizedDateModule,
    FlexLayoutModule,
  ],
  declarations: [UserProfileComponent],
  exports: [UserProfileComponent],
})
export class UserProfileModule {}
