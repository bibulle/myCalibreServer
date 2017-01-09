import { Component, OnInit, NgModule } from '@angular/core';
import { MdInputModule, MdCardModule, MdButtonModule } from "@angular/material";
import { RouterModule, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { LoginService } from "./login.service";
import { Logger } from "angular2-logger/core";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private _loginSubscription = null;

  constructor(private _router: Router,
              private _logger: Logger,
              private _loginService: LoginService) { }

  ngOnInit() {

    this._loginService.checkAuthent();
    this._loginSubscription = this._loginService.userObservable().subscribe(
      user => {
        if (user.username) {
          this._router.navigate(['home']);
        }
      }
    );
  }
  //noinspection JSUnusedGlobalSymbols
  ngOnDestroy (): any {
    this._loginSubscription.unsubscribe();
  }


  login(event, username, password) {
    //console.log(username+" "+password);
    event.preventDefault();

    this._loginService.login(username, password)
        .then(() => {
          this._router.navigate(['home']);
        })
        .catch( () => {
          this._logger.warn("Error during login process");
        });
  }

  signup(event) {
    event.preventDefault();
    this._router.navigate(['/signup']);
  }


}

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MdButtonModule,
    MdCardModule,
    MdInputModule,
  ],
  declarations: [LoginComponent],
  providers: [
    LoginService
  ],
  exports: [LoginComponent]
})
export class LoginModule { }