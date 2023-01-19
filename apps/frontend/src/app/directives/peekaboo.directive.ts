/* tslint:disable:member-ordering */
import {
  Directive,
  OnDestroy,
  Input,
  ElementRef,
  NgZone,
  NgModule,
  HostBinding,
  OnInit,
  HostListener,
} from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

export type BreakAction = 'hide' | 'show';

/**
 * @name MatPeekabooDirective
 *
 * @description
 * The `[mat-peekaboo]` directive is an attribute that toggles the visibility of elements based
 * on the current viewport size and scrollTop.
 *
 */
@Directive({
  selector: '[myCalibreServerMatPeekaboo]',
})
export class MatPeekabooDirective implements OnInit {
  static SIZES: string[] = [
    '(max-width: 599px)',
    '(min-width: 600px) and (max-width: 959px)',
    '(min-width: 960px) and (max-width: 1279px)',
    '(min-width: 1280px) and (max-width: 1919px)',
    '(min-width: 1920px)',
  ];

  private _active = false;
  private _breakXs = -1;
  private _breakSm = -1;
  private _breakMd = -1;
  private _breakLg = -1;
  private _breakXl = -1;
  private _breakpoint: string | null = null;
  private _scroller: any;
  // private _mediaListeners: MediaListener[] = [];

  @HostListener('window:scroll')
  _windowScroll = this.evaluate.bind(this);

  @HostBinding('class.mat-peekaboo-active')
  get active(): boolean {
    return this._active;
  }

  @HostBinding('class.mat-peekaboo-inactive')
  get inactive(): boolean {
    return !this._active;
  }

  @Input()
  break = 100;

  @Input()
  @HostBinding('attr.breakAction')
  breakAction: BreakAction = 'hide';

  static MakeNumber(value: any): number {
    return typeof value === 'string' ? parseInt(value, 10) : value;
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

  set breakpoint(size: string | null) {
    this._breakpoint = size;
    this.evaluate();
  }

  get breakpoint(): string | null {
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
    }, 100);
  }

  get scroller(): any {
    return this._scroller;
  }

  constructor(
    // public media: Media,
    private element: ElementRef,
    // public viewport: ViewportHelper,
    private zone: NgZone,
    public _breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    MatPeekabooDirective.SIZES.forEach((size: string) => {
      this._breakpointObserver
        .observe([size])
        .subscribe((state: BreakpointState) => {
          if (state.matches) {
            this._breakpoint = size;
          }
        });
    });
    this.evaluate();
  }


  /**
   * Evaluate the current scroll and media breakpoint to determine what scrollTop
   * value should be used for the peekaboo active state.
   * @returns number The scrollTop breakpoint that was evaluated against.
   */
  evaluate(): number {
    const top = this._scroller
      ? this._scroller.scrollTop
      : MatPeekabooDirective.scrollTop();
    let bp: number = this.break;
    switch (this._breakpoint) {
      case MatPeekabooDirective.SIZES[0]:
        if (this._breakXl !== -1) {
          bp = this._breakXl;
        }
        break;
      case MatPeekabooDirective.SIZES[1]:
        if (this._breakLg !== -1) {
          bp = this._breakLg;
        }
        break;
      case MatPeekabooDirective.SIZES[2]:
        if (this._breakMd !== -1) {
          bp = this._breakMd;
        }
        break;
      case MatPeekabooDirective.SIZES[3]:
        if (this._breakSm !== -1) {
          bp = this._breakSm;
        }
        break;
      case MatPeekabooDirective.SIZES[4]:
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

  // eslint-disable-next-line @typescript-eslint/member-ordering
  static scrollTop(): number {
    return window.pageYOffset || document.documentElement.scrollTop;
  }
}

@NgModule({
  declarations: [MatPeekabooDirective],
  exports: [MatPeekabooDirective],
})
export class MdPeekabooModule {}
