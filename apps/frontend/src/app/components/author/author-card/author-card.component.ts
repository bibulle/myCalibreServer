import { CommonModule } from '@angular/common';
import { Component, Input, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { Author } from '@my-calibre-server/api-interfaces';
import { TranslatePipe } from '@ngx-translate/core';
import { ImageSpritesModule } from '../../image-sprites/image-sprites.component';

const AVATAR_PALETTE = ['#0d3b3b', '#b0472f', '#23306e', '#2f3d33', '#5c1a24', '#3a4a63', '#8a5a1e', '#155454'];

@Component({
    selector: 'my-calibre-server-author-card',
    templateUrl: './author-card.component.html',
    styleUrls: ['./author-card.component.scss'],
    standalone: false
})
export class AuthorCardComponent {
  @Input()
  author?: Author;

  @Input()
  index = 0;

  @Input()
  booksClosed = true;

  constructor(private _router: Router) {}

  toggleBooksClosed() {
    this.booksClosed = !this.booksClosed;
  }

  get avatarBg(): string {
    return AVATAR_PALETTE[this.index % AVATAR_PALETTE.length];
  }

  get initials(): string {
    if (!this.author?.author_name) {
      return '';
    }
    const parts = this.author.author_name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  get yearsRange(): string {
    const years = (this.author?.book_date ?? []).map((d) => new Date(d).getFullYear()).filter((y) => y > 1850);
    if (!years.length) {
      return '';
    }
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? `${min}` : `${min} – ${max}`;
  }

  openBook(event: Event, bookId: number) {
    event.stopPropagation();
    this._router.navigate(['/book', bookId]);
  }
}

@NgModule({
  imports: [CommonModule, TranslatePipe, ImageSpritesModule],
  declarations: [AuthorCardComponent],
  exports: [AuthorCardComponent],
})
export class AuthorCardModule {}
