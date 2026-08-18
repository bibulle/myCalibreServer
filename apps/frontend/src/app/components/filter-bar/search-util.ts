/**
 * Shared text-search helpers for the list pages (books, authors, series, tags).
 *
 * The search is accent- and case-insensitive, and matches word by word:
 * every word of the query must appear somewhere in the searched text, in any
 * order ("clamser tataouine" matches "Clamser à Tataouine").
 */

export function cleanAccent(str: string): string {
  // NFKD splits every accented letter into its base letter plus combining
  // marks (U+0300-U+036F), which are then stripped: this covers î, ç, ñ, ÿ,
  // ā... without maintaining a hand-written list. Ligatures (æ, œ) and ø
  // have no Unicode decomposition, so they keep explicit replacements.
  return str
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[œ]/g, 'oe')
    .replace(/[ø]/g, 'o')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearch(strToSearch: string, search: string): boolean {
  const target = cleanAccent(strToSearch);
  return search
    .trim()
    .split(/\s+/)
    .every((word) => target.includes(cleanAccent(word)));
}
