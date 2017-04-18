import {Component, OnInit} from '@angular/core';
import {Filter, FilterService} from "../../filter-bar/filter.service";
import {UserService} from "../user.service";
import {User} from "../user";
import {Router} from "@angular/router";
import {Subject} from "rxjs";
import {NotificationService} from "../../notification/notification.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: User = new User({});

  amazonEmail:string;

  oldUserJson: string;

  // The queue to manage user choices
  private subjectUser: Subject<User>;


  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _notificationService: NotificationService,
              private _router: Router) {
  }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));

    this._userService.checkAuthent();

    // get user change from elsewhere
    this._userService.userObservable().subscribe(
      user => {
        //console.log(user.local);
        this.user = new User(user);

        this.oldUserJson = JSON.stringify(this.user);
      });

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
              .then(() => {
                this._userService.checkAuthent();
                this._notificationService.message("All your modifications have been saved...");
              })
              .catch(error => {
                console.error(error);
                this._notificationService.error("Error saving you changes !!\n\t" + (error.message || error));
              });
          },
          error => {
            console.error(error)
          }
        );
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
   * Logout
   */
  logout() {
    this._userService.logout();
    this._router.navigate(['/home'])
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

    this._userService.startLoginFacebook()
      .then(() => {
        this._router.navigate(['/profile']);
      })
      .catch( (err) => {
        this._notificationService.error(err);
      });
  }
  /**
   * Connect with google
   */
  connectGoogle() {
    event.preventDefault();

    this._userService.startLoginGoogle()
      .then(() => {
        this._router.navigate(['/profile']);
      })
      .catch( (err) => {
        this._notificationService.error(err);
      });
  }

  /**
   * Unlink with facebook
   */
  unlinkFacebook() {
    event.preventDefault();

    this._userService.unlinkFacebook()
      .then(() => {
        this._router.navigate(['/profile']);
      })
      .catch( (err) => {
        this._notificationService.error(err);
      });
  }
  /**
   * Unlink with google
   */
  unlinkGoogle() {
    event.preventDefault();

    this._userService.unlinkGoogle()
      .then(() => {
        this._router.navigate(['/profile']);
      })
      .catch( (err) => {
        this._notificationService.error(err);
      });
  }

}
