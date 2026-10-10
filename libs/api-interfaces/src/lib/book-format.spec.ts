import { BookData } from './book';
import { availableBookFormats, BOOK_FORMATS, findBookFormat, preferredBookFormat, preferredKindleFormat } from './book-format';

describe('book formats', () => {
  const data = (...formats: string[]): BookData[] =>
    formats.map((data_format, i) => new BookData({ data_id: i, data_format, data_size: 100, data_name: 'Book_Title' }));

  describe('BOOK_FORMATS', () => {
    it('should describe each format with a unique id and priority', () => {
      expect(new Set(BOOK_FORMATS.map((f) => f.id)).size).toBe(BOOK_FORMATS.length);
      expect(new Set(BOOK_FORMATS.map((f) => f.priority)).size).toBe(BOOK_FORMATS.length);
    });

    it('should use a lower case extension and an upper case id', () => {
      BOOK_FORMATS.forEach((format) => {
        expect(format.extension).toBe(format.extension.toLowerCase());
        expect(format.id).toBe(format.id.toUpperCase());
      });
    });

    it('should not offer MOBI to Amazon, which dropped it in 2023', () => {
      expect(findBookFormat('MOBI')?.kindleCompatible).toBe(false);
      expect(findBookFormat('EPUB')?.kindleCompatible).toBe(true);
      expect(findBookFormat('PDF')?.kindleCompatible).toBe(true);
    });
  });

  describe('findBookFormat', () => {
    it.each(['EPUB', 'epub', 'ePub'])('should find a format whatever the case of %s', (wanted) => {
      expect(findBookFormat(wanted)?.id).toBe('EPUB');
    });

    it('should return undefined for an unknown format', () => {
      expect(findBookFormat('djvu')).toBeUndefined();
    });

    it.each([undefined, null, ''])('should return undefined for %s', (wanted) => {
      expect(findBookFormat(wanted)).toBeUndefined();
    });
  });

  describe('availableBookFormats', () => {
    it('should keep only the formats the book has, best first', () => {
      expect(availableBookFormats(data('MOBI', 'PDF', 'EPUB')).map((f) => f.id)).toEqual(['EPUB', 'PDF', 'MOBI']);
    });

    it('should drop formats this server does not serve', () => {
      expect(availableBookFormats(data('DJVU', 'PDF')).map((f) => f.id)).toEqual(['PDF']);
    });

    it('should match the format whatever its case in the database', () => {
      expect(availableBookFormats(data('pdf')).map((f) => f.id)).toEqual(['PDF']);
    });

    it.each([undefined, null, []])('should return an empty list for %s', (bookData) => {
      expect(availableBookFormats(bookData)).toEqual([]);
    });
  });

  describe('preferredBookFormat', () => {
    it('should prefer EPUB over the others', () => {
      expect(preferredBookFormat(data('MOBI', 'EPUB', 'PDF'))?.id).toBe('EPUB');
    });

    it('should fall back to the only format available', () => {
      expect(preferredBookFormat(data('PDF'))?.id).toBe('PDF');
    });

    it('should return undefined when no format is servable', () => {
      expect(preferredBookFormat(data('DJVU'))).toBeUndefined();
    });
  });

  describe('preferredKindleFormat', () => {
    it('should prefer EPUB when the book has both EPUB and PDF', () => {
      expect(preferredKindleFormat(data('PDF', 'EPUB'))?.id).toBe('EPUB');
    });

    it('should pick the PDF of a PDF-only book', () => {
      expect(preferredKindleFormat(data('PDF'))?.id).toBe('PDF');
    });

    it('should return undefined for a MOBI-only book', () => {
      expect(preferredKindleFormat(data('MOBI'))).toBeUndefined();
    });
  });
});
