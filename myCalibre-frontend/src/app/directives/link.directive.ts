import { Directive, Output, EventEmitter, ElementRef } from '@angular/core';
import { Ink } from '../core/util/ink';

@Directive({
  selector: '[mat-ink]',
  host: {
    '(mousedown)': 'onMousedown($event)'
  },
})
export class MatInkDirective {

  @Output()
  inked: EventEmitter<MatInkDirective> = new EventEmitter<MatInkDirective>(false);

  constructor(private _element: ElementRef) {
  }

  onMousedown(event) {
    if (this._element && Ink.canApply(this._element.nativeElement)) {
      Ink.rippleEvent(this._element.nativeElement, event).then(() => {
        this.inked.emit(this);
      });
    }
  }
}
