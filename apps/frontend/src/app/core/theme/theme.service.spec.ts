import { ThemeService } from './theme.service';

function mockMatchMedia(matchesDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: matchesDark && query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('ThemeService', () => {

  function themeColorMeta(): HTMLMetaElement {
    return document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark-theme');
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
    // index.html ships the light value as the pre-bootstrap default
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#fffdf8');
    document.head.appendChild(meta);
  });

  it('should default to light when the system prefers light and nothing is stored', () => {
    mockMatchMedia(false);

    const service = new ThemeService();

    expect(service.mode).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should default to dark when the system prefers dark and nothing is stored', () => {
    mockMatchMedia(true);

    const service = new ThemeService();

    expect(service.mode).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('should prefer the stored mode over the system preference', () => {
    mockMatchMedia(true);
    localStorage.setItem('my-calibre-server-theme', 'light');

    const service = new ThemeService();

    expect(service.mode).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should ignore an invalid stored value and fall back to the system preference', () => {
    mockMatchMedia(true);
    localStorage.setItem('my-calibre-server-theme', 'not-a-theme');

    const service = new ThemeService();

    expect(service.mode).toBe('dark');
  });

  it('should persist and apply the mode when setMode is called', () => {
    mockMatchMedia(false);
    const service = new ThemeService();

    service.setMode('dark');

    expect(service.mode).toBe('dark');
    expect(localStorage.getItem('my-calibre-server-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('should toggle between light and dark', () => {
    mockMatchMedia(false);
    const service = new ThemeService();

    service.toggle();
    expect(service.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    service.toggle();
    expect(service.mode).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  describe('PWA theme-color (issue #242)', () => {
    it('should set the light chrome colour when starting in light mode', () => {
      mockMatchMedia(false);

      new ThemeService();

      expect(themeColorMeta().getAttribute('content')).toBe('#fffdf8');
    });

    it('should set the dark chrome colour when starting in dark mode', () => {
      mockMatchMedia(true);

      new ThemeService();

      expect(themeColorMeta().getAttribute('content')).toBe('#191511');
    });

    it('should follow the theme when the user toggles it', () => {
      mockMatchMedia(false);
      const service = new ThemeService();

      service.toggle();
      expect(themeColorMeta().getAttribute('content')).toBe('#191511');

      service.toggle();
      expect(themeColorMeta().getAttribute('content')).toBe('#fffdf8');
    });

    it('should never fall back to the old green accent', () => {
      mockMatchMedia(true);
      const service = new ThemeService();

      service.setMode('light');

      expect(themeColorMeta().getAttribute('content')).not.toBe('#4caf50');
    });

    it('should not crash when the page has no theme-color meta', () => {
      mockMatchMedia(false);
      themeColorMeta().remove();

      expect(() => new ThemeService()).not.toThrow();
    });
  });
});
