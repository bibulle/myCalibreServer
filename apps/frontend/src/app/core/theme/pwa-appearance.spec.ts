import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The PWA's install-time appearance lives in static files that no component
 * test would otherwise touch: the manifest, the app icon and the pre-bootstrap
 * `theme-color` meta. They kept the pre-"Reliure" green long after the UI
 * moved on (issue #242), so these tests pin them to the current palette (see
 * app/shared/_tokens.scss).
 */
describe('PWA appearance (issue #242)', () => {
  const srcRoot = join(__dirname, '..', '..', '..');
  const read = (relative: string) => readFileSync(join(srcRoot, relative), 'utf-8');

  const OLD_GREENS = ['#4caf50', '#43a047'];

  describe('manifest.webmanifest', () => {
    const manifest = JSON.parse(read('manifest.webmanifest'));

    it('should use the header surface as the system chrome colour', () => {
      expect(manifest.theme_color).toBe('#fffdf8');
    });

    it('should use the app background as the splash screen colour', () => {
      expect(manifest.background_color).toBe('#f4efe5');
    });

    it('should not reference the old green anywhere', () => {
      expect(read('manifest.webmanifest').toLowerCase()).not.toContain('#4caf50');
    });
  });

  describe('app icon', () => {
    const icon = read('assets/Bib_Icon.svg').toLowerCase();

    it('should fill the icon disc with the accent colour', () => {
      expect(icon).toContain('fill:#c0563a');
    });

    it('should no longer carry any of the old greens', () => {
      OLD_GREENS.forEach((green) => expect(icon).not.toContain(green));
    });
  });

  describe('index.html', () => {
    const html = read('index.html').toLowerCase();

    it('should ship the light chrome colour as the pre-bootstrap default', () => {
      // ThemeService swaps this to the dark value once the app boots; the
      // static value only has to cover the very first paint.
      expect(html).toContain('<meta name="theme-color" content="#fffdf8">');
    });

    it('should not ship the old green', () => {
      expect(html).not.toContain('#4caf50');
    });
  });
});
