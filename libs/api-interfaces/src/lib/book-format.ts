import { BookData } from './book';

/**
 * Identifiers of the Calibre formats this server knows how to serve.
 * Adding a format means adding an entry to BOOK_FORMATS below — nothing else,
 * neither in the API nor in the frontend, enumerates them.
 */
export type BookFormatId = 'EPUB' | 'PDF' | 'MOBI';

export interface BookFormat {
  /** Calibre's `data.format` value, always upper case. */
  id: BookFormatId;
  /** File extension on disk, always lower case. */
  extension: string;
  /** Content-Type sent when the file is downloaded. */
  mimeType: string;
  /** Translation key of the human readable name. */
  labelKey: string;
  /**
   * Rank used when a single format has to be picked automatically: the quick
   * download of a list card, or the file sent to a Kindle. Lower comes first.
   */
  priority: number;
  /**
   * Whether Amazon accepts the format through the Send-to-Kindle mail service.
   * MOBI was dropped by Amazon in 2023, PDF and EPUB are still accepted.
   */
  kindleCompatible: boolean;
}

export const BOOK_FORMATS: BookFormat[] = [
  { id: 'EPUB', extension: 'epub', mimeType: 'application/epub+zip', labelKey: 'label.epub-format', priority: 1, kindleCompatible: true },
  { id: 'PDF', extension: 'pdf', mimeType: 'application/pdf', labelKey: 'label.pdf-format', priority: 2, kindleCompatible: true },
  { id: 'MOBI', extension: 'mobi', mimeType: 'application/x-mobipocket-ebook', labelKey: 'label.mobi-format', priority: 3, kindleCompatible: false },
];

/**
 * Find a format by its Calibre identifier, whatever the case used by the
 * caller (a route parameter is typically lower case).
 */
export function findBookFormat(format: string | undefined | null): BookFormat | undefined {
  if (!format) {
    return undefined;
  }
  const wanted = format.toUpperCase();
  return BOOK_FORMATS.find((f) => f.id === wanted);
}

/**
 * The formats of `data` this server can serve, sorted by priority. Formats
 * Calibre knows but this server does not are dropped.
 */
export function availableBookFormats(data: BookData[] | undefined | null): BookFormat[] {
  if (!data) {
    return [];
  }
  return BOOK_FORMATS.filter((f) => data.some((d) => d.data_format?.toUpperCase() === f.id)).sort((a, b) => a.priority - b.priority);
}

/** The format to use when the user did not pick one, or undefined if none is available. */
export function preferredBookFormat(data: BookData[] | undefined | null): BookFormat | undefined {
  return availableBookFormats(data)[0];
}

/** The format to mail to a Kindle, or undefined if the book has none Amazon accepts. */
export function preferredKindleFormat(data: BookData[] | undefined | null): BookFormat | undefined {
  return availableBookFormats(data).find((f) => f.kindleCompatible);
}
