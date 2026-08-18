/**
 * Shared text-search helpers for the list pages (books, authors, series, tags).
 *
 * The search is accent- and case-insensitive, and matches word by word:
 * every word of the query must appear somewhere in the searched text, in any
 * order ("clamser tataouine" matches "Clamser à Tataouine").
 */

export function cleanAccent(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àâªáäãåā]/g, 'a')
    .replace(/[èéêëęėē]/g, 'e')
    .replace(/[iïìíįī]/g, 'i')
    .replace(/[ôºöòóõøō]/g, 'o')
    .replace(/[ûùüúū]/g, 'u')
    .replace(/[æ]/g, 'ae')
    .replace(/[œ]/g, 'oe');
}

export function matchesSearch(strToSearch: string, search: string): boolean {
  const target = cleanAccent(strToSearch);
  return search
    .trim()
    .split(/\s+/)
    .every((word) => target.includes(cleanAccent(word)));
}
