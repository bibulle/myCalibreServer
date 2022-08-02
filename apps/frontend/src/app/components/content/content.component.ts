import {Component, Directive, NgModule} from '@angular/core';

/**
 * @name matContent
 *
 * @description
 * The `<mat-content>` directive is a container element useful for scrollable content
 *
 * @usage
 *
 * - Add the `[layout-padding]` attribute to make the content padded.
 *
 * <hljs lang="html">
 *  <mat-content layout-padding>
 *      Lorem ipsum dolor sit amet, ne quod novum mei.
 *  </mat-content>
 * </hljs>
 *
 */
@Directive({selector: 'mat-content'})
export class MatContentDirective {
}

@NgModule({
  declarations: [MatContentDirective],
  exports: [MatContentDirective]
})
export class MatContentModule {}
