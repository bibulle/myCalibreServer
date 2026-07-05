import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'my-calibre-server-theme';
const DARK_CLASS = 'dark-theme';

@Injectable()
export class ThemeService {

  private _mode: ThemeMode;

  constructor() {
    this._mode = this._readStoredMode() ?? this._systemMode();
    this._apply(this._mode);
  }

  get mode(): ThemeMode {
    return this._mode;
  }

  isDark(): boolean {
    return this._mode === 'dark';
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    this._apply(mode);
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  private _apply(mode: ThemeMode): void {
    document.documentElement.classList.toggle(DARK_CLASS, mode === 'dark');
  }

  private _readStoredMode(): ThemeMode | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  private _systemMode(): ThemeMode {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
