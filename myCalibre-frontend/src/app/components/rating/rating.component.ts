import {Component, EventEmitter, Input, NgModule, OnInit, Output, ViewEncapsulation} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';

@Component({
  selector: 'mat-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatRatingComponent implements OnInit {

  @Input('disabled') private disabled: boolean;
  @Input('rating') private rating: number;
  @Input('starCount') private starCount = 5;
  @Input('color') private color: string;
  @Input('title') title: string;
  @Output() private ratingUpdated = new EventEmitter();

  private snackBarDuration = 2000;
  ratingArr = [];

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit() {

    for (let index = 0; index < this.starCount; index++) {
      this.ratingArr.push(index);
    }

  }

  onClick(rating: number) {
    // console.log(this.disabled);
    // console.log(rating);
    // this.snackBar.open('You rated ' + rating + ' / ' + this.starCount, '', {
    //  duration: this.snackBarDuration
    // });
    this.ratingUpdated.emit(rating);
    return false;
  }

  showIcon(index: number) {
    if (this.rating >= index + 1) {
      return 'star';
    } else {
      return 'star_border';
    }
  }

}

@NgModule({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    BrowserModule
  ],
  declarations: [
    MatRatingComponent
  ],
  exports: [
    MatRatingComponent
  ]
})
export class MatRatingModule {
}
