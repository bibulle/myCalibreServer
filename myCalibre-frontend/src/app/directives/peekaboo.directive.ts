import {Directive, OnDestroy, Input, ElementRef, NgZone, NgModule, HostBinding} from '@angular/core';
import {Media, MediaListener} from '../core/util/media';
import {ViewportHelper} from '../core/util/viewport';

export type BreakAction = 'hide' | 'show';

/**
 * @name matPeekaboo
 *
 * @description
 * The `[mat-peekaboo]` directive is an attribute that toggles the visibility of elements based
 * on the current viewport size and scrollTop.
 *
 */
@Directive({
  selector: '[mat-peekaboo]',
  host: {
    '[class.mat-peekaboo-active]': 'active',
    '[class.mat-peekaboo-inactive]': '!active',
    '[attr.breakAction]': 'breakAction',
    '(window:scroll)': '_windowScroll($event)'
  }
})
export class MatPeekabooDirective implements OnDestroy {

  static SIZES: string[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  private _active = false;
  private _breakXs = -1;
  private _breakSm = -1;
  private _breakMd = -1;
  private _breakLg = -1;
  private _breakXl = -1;
  private _breakpoint: string = null;
  private _scroller: any;
  private _mediaListeners: MediaListener[] = [];
  _windowScroll = this.evaluate.bind(this);


  @Input()
  break = 100;

  @Input()
  breakAction: BreakAction;

  static MakeNumber(value: any): number {
    return typeof value === 'string' ? parseInt(value, 10) : value;
  }

  get active(): boolean {
    return this._active;
  }

  @Input() set breakXs(value: number) {
    this._breakXs = MatPeekabooDirective.MakeNumber(value);
  }

  get breakXs(): number {
    return this._breakXs;
  }

  @Input() set breakSm(value: number) {
    this._breakSm = MatPeekabooDirective.MakeNumber(value);
  }

  get breakSm(): number {
    return this._breakSm;
  }

  @Input() set breakMd(value: number) {
    this._breakMd = MatPeekabooDirective.MakeNumber(value);
  }

  get breakMd(): number {
    return this._breakMd;
  }

  @Input() set breakLg(value: number) {
    this._breakLg = MatPeekabooDirective.MakeNumber(value);
  }

  get breakLg(): number {
    return this._breakLg;
  }

  @Input() set breakXl(value: number) {
    this._breakXl = MatPeekabooDirective.MakeNumber(value);
  }

  get breakXl(): number {
    return this._breakXl;
  }

  set breakpoint(size: string) {
    this._breakpoint = size;
    this.evaluate();
  }

  get breakpoint(): string {
    return this._breakpoint;
  }


  @Input() set scroller(scroll: any) {
    setTimeout(() => {
      if (this._scroller) {
        this._scroller.removeEventListener('scroll', this._windowScroll);
      }
      this._scroller = scroll;
      if (this._scroller) {
        this._scroller.addEventListener('scroll', this._windowScroll, true);
      }
    }, 100)
  }

  get scroller(): any {
    return this._scroller;
  }



  constructor(public media: Media,
              private element: ElementRef,
              public viewport: ViewportHelper,
              private zone: NgZone) {
    MatPeekabooDirective.SIZES.forEach((size: string) => {
      this._watchMediaQuery(size);
      if (this.media.hasMedia(size)) {
        this._breakpoint = size;
      }
    });
    this.evaluate();
  }

  ngOnDestroy(): any {
    this._mediaListeners.forEach((l: MediaListener) => {
      l.destroy();
    });
    this._mediaListeners = [];
  }

  private _watchMediaQuery(size: string) {
    let l = this.media.listen(Media.getQuery(size));
    l.onMatched.subscribe((mql: MediaQueryList) => {
      this.breakpoint = size;
    });
    this._mediaListeners.push(l);
  }

  /**
   * Evaluate the current scroll and media breakpoint to determine what scrollTop
   * value should be used for the peekaboo active state.
   * @returns number The scrollTop breakpoint that was evaluated against.
   */
  evaluate(): number {
    let top = this._scroller ? this._scroller.scrollTop : this.viewport.scrollTop();
    let bp: number = this.break;
    switch (this._breakpoint) {
      case 'xl':
        if (this._breakXl !== -1) {
          bp = this._breakXl;
          break;
        }
      case 'lg':
        if (this._breakLg !== -1) {
          bp = this._breakLg;
          break;
        }
      case 'md':
        if (this._breakMd !== -1) {
          bp = this._breakMd;
          break;
        }
      case 'sm':
        if (this._breakSm !== -1) {
          bp = this._breakSm;
          break;
        }
      case 'xs':
        if (this._breakXs !== -1) {
          bp = this._breakXs;
          break;
        }
    }
    if (top >= bp && !this._active) {
      this.zone.run(() => {
        this._active = true;
      });
    } else if (top < bp && this._active) {
      this.zone.run(() => {
        this._active = false;
      });
    }
    return bp;
  }

}

@NgModule({
  declarations: [MatPeekabooDirective],
  exports: [MatPeekabooDirective]
})
export class MdPeekabooModule {}
