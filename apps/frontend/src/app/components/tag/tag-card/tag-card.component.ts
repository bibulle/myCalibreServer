import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, Output, ChangeDetectionStrategy } from '@angular/core';
import { Tag } from '@my-calibre-server/api-interfaces';

@Component({
    selector: 'my-calibre-server-tag-card',
    templateUrl: './tag-card.component.html',
    styleUrls: ['./tag-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TagCardComponent {
  @Input()
  tag?: Tag;

  @Input()
  active = false;

  @Input()
  weight = 500;

  @Input()
  fontSize = '13px';

  @Output()
  selected = new EventEmitter<void>();
}

@NgModule({
  imports: [CommonModule],
  declarations: [TagCardComponent],
  exports: [TagCardComponent],
})
export class TagCardModule {}
