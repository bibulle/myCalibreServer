import {Component, EventEmitter, Input, NgModule, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {MatButtonModule, MatIconModule, MatSnackBar, MatTooltipModule} from '@angular/material';
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
  @Input('title') private title: string;
  @Output() private ratingUpdated = new EventEmitter();

  private snackBarDuration = 2000;
  private ratingArr = [];

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit() {

    for (let index = 0; index < this.starCount; index++) {
      this.ratingArr.push(index);
    }

  }

  onClick(rating: number) {
    console.log(this.disabled);
    console.log(rating);
    this.snackBar.open('You rated ' + rating + ' / ' + this.starCount, '', {
      duration: this.snackBarDuration
    });
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
