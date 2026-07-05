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

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark-theme');
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
});
