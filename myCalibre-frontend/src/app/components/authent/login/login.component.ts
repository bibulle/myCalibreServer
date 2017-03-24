import { Component, OnInit } from '@angular/core';
import { FilterService, Filter } from "../../filter-bar/filter.service";
import { Router } from "@angular/router";
import { UserService } from "../user.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private _filterService: FilterService,
              private _userService: UserService,
              private _router: Router) { }

  ngOnInit() {
    this._filterService.update(new Filter({not_displayed: true}));
  }

  login(event, email, password) {
    //console.log(email+" "+password);
    event.preventDefault();

    this._userService.logout();

    this._userService.login(email, password)
        .then(() => {
          this._router.navigate(['home']);
        })
        .catch( () => {
          console.warn("Error during login process");
        });
  }

   signup() {
    console.log("signup");
     //event.preventDefault();
     this._router.navigate(['signup']);
   }

}
