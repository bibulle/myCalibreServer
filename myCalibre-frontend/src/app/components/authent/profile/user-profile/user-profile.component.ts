import {Component, Input, NgModule, OnInit, SimpleChanges} from '@angular/core';
import {User} from "../../user";
import {Subject} from "rxjs";
import {UserService} from "../../user.service";
import {NotificationService} from "app/components/notification/notification.service";
import {Router} from "@angular/router";
import {CommonModule} from "@angular/common";
import {MdButtonModule, MdCardModule, MdCheckboxModule, MdIconModule, MdInputModule} from "@angular/material";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  @Input()
  user: User;

  @Input()
  urlToRedirect = '/profile';

  amazonEmail: string;

  oldUserJson: string;

  // The queue to manage user choices
  private subjectUser: Subject<User>;

  constructor(private _userService: UserService,
              private _notificationService: NotificationService,
              private _router: Router) {
  }

  ngOnInit() {

    // ----------
    // Save user choice changes to Db
    // ----------
    if (!this.subjectUser) {
      this.subjectUser = new Subject<User>();
      this.subjectUser
        .debounceTime(500)
        .subscribe(
          user => {
            //console.log(user);
            return this._userService.save(user)
              .then((newUser) => {
                if (!newUser) {
                  this._userService.checkAuthent();
                  this._notificationService.message("All your modifications have been saved...");
                } else {
                  this.user = newUser;
                  this._notificationService.message("All your modifications have been saved...");
                }
              })
              .catch(error => {
                console.error(error);
                if (error) {
                  this._notificationService.error("Error saving you changes !!\n\t" + (error.message || error));
                } else {
                  this._notificationService.error("Error saving you changes !!");
                }
              });
          },
          error => {
            console.error(error)
          }
        );
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.user) {
      this.oldUserJson = JSON.stringify(this.user);
      //console.log(this.oldUserJson);
    }

  }

  /**
   * Save user changes
   */
  userChange() {

    if (this.oldUserJson === JSON.stringify(this.user)) {
      return;
    }

    this.oldUserJson = JSON.stringify(this.user);

    this.subjectUser.next(this.user);
  }

  /**
   * Add an email to the list
   */
  addEmail() {
    if (!this.user || !this.user.local || !this.user.local.amazonEmails) {
      this.user.local.amazonEmails = [];
    }

    if (!this.amazonEmail || (this.amazonEmail.trim() == "")) {
      return;
    }
    this.amazonEmail = this.amazonEmail.trim();

    const found = this.user.local.amazonEmails.filter(el => {
      return el.trim() === this.amazonEmail;
    });
    if (found.length == 0) {
      this.user.local.amazonEmails.push(this.amazonEmail);
      this.amazonEmail = null;
    }

    this.userChange();
  }

  /**
   * Del an email to the list
   */
  delEmail(email) {
    if (!this.user && !this.user.local && !this.user.local.amazonEmails) {
      this.user.local.amazonEmails = [];
    }

    // filter
    this.user.local.amazonEmails = this.user.local.amazonEmails.filter(el => {
      return el.trim() !== email.trim();
    });

    this.userChange();
  }


  /**
   * Connect locally (with user/password)
   */
  connectLocal() {
    this._router.navigate(['/connect/local']);
  }

  /**
   * Connect with facebook
   */
  connectFacebook() {
    event.preventDefault();

    if (this.user.id !== this._userService.getUser().id) {
      return this._notificationService.error("Not allowed");
    }

    this._userService.startLoginFacebook()
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
    event.preventDefault();

    if (this.user.id !== this._userService.getUser().id) {
      return this._notificationService.error("Not allowed");
    }

    this._userService.startLoginGoogle()
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
    event.preventDefault();

    this._userService.unlinkFacebook(this.user.id)
      .then((user) => {
        if (this.user.id !== this._userService.getUser().id) {
          this.user.facebook = user.facebook;
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
    event.preventDefault();

    this._userService.unlinkGoogle(this.user.id)
      .then((user) => {
        if (this.user.id !== this._userService.getUser().id) {
          this.user.google = user.google;
        } else {
          this._router.navigate([this.urlToRedirect]);
        }
      })
      .catch((err) => {
        this._notificationService.error(err);
      });
  }

}

@NgModule({
  imports: [
    CommonModule,
    MdButtonModule,
    MdCardModule,
    MdIconModule,
    MdCheckboxModule,
    FormsModule,
    MdInputModule
  ],
  declarations: [
    UserProfileComponent
  ],
  exports: [
    UserProfileComponent
  ]
})
export class UserProfileModule {
}
