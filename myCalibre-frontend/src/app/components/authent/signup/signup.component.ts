import { Component, OnInit } from '@angular/core';
import { FilterService, Filter } from "../../filter-bar/filter.service";
import { UserService } from "../user.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  constructor (private _filterService: FilterService,
               private _userService: UserService,
               private _router: Router) { }

  ngOnInit () {
    this._filterService.update(new Filter({ not_displayed: true }));
  }

  signup (event, email, password) {
    //console.log(email+" "+password);
    event.preventDefault();

    this._userService.signup(email, password)
        .then(() => {
          this._router.navigate(['home']);
        })
        .catch((err) => {
          console.warn("Error during login process " + err);
        });
  }

  login () {
    this._router.navigate(['/login']);
  }

}
