/**
 * Start a browser download for an already tokenised URL.
 *
 * The anchor has to exist in the document for the click to be honoured, so it
 * is inserted hidden and removed straight away.
 */
export function triggerBrowserDownload(url: string): void {
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
