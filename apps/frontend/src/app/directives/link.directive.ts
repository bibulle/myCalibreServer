import { Directive, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { Ink } from '../core/util/ink';

@Directive({
  selector: '[myCalibreServerMatInk]',
})
export class MatInkDirective {

  @Output()
  inked: EventEmitter<MatInkDirective> = new EventEmitter<MatInkDirective>(false);

  constructor(private _element: ElementRef) {
  }

  @HostListener('mousedown') onMousedown(event: MouseEvent) {
    if (this._element && Ink.canApply(this._element.nativeElement)) {
      Ink.rippleEvent(this._element.nativeElement, event).then(() => {
        this.inked.emit(this);
      });
    }
  }
}
