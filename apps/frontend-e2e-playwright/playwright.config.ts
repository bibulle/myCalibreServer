import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Playwright e2e suite - the only e2e suite in this workspace (replaces the
 * former Cypress suite). Runs against the real API and frontend dev servers,
 * with MongoDB swapped for an in-memory stub (see ./mongo-stub) so no
 * MongoDB instance is needed anywhere - locally or in CI. See
 * `apps/frontend-e2e-playwright/README.md`.
 */

// Some sandboxed CI environments pre-install a Chromium build that may not
// match this workspace's pinned Playwright version, at a fixed path, with
// browser downloads blocked - point directly at it there. Everywhere else
// (including local dev), omit executablePath entirely so Playwright resolves
// the browser it installed itself (`npx playwright install chromium`).
const sandboxChromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const launchOptions = fs.existsSync(sandboxChromiumPath) ? { executablePath: sandboxChromiumPath } : {};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions,
      },
    },
  ],
  webServer: [
    {
      command: 'npx nx serve api',
      url: 'http://localhost:3333/api/version',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PORT: '3333',
        PATH_BOOKS: path.resolve(__dirname, '../../test/data/calibre'),
        PATH_MY_CALIBRE: path.resolve(__dirname, '../../test/data/my-calibre'),
        SESSION_SECRET: 'e2e-test-session-secret',
        AUTHENT_JWT_SECRET: 'e2e-test-jwt-secret',
        AUTHENT_LENGTH: '64',
        AUTHENT_DIGEST: 'sha256',
        // passport-facebook/passport-google-oauth20 validate their options
        // synchronously in the constructor and throw if clientID is empty,
        // which crashes the whole Nest app at boot. These strategies are
        // always instantiated (see authentication.module.ts) even though
        // this suite never exercises OAuth login, so dummy values are
        // enough - no real Facebook/Google app is contacted.
        AUTHENT_FACEBOOK_CLIENTID: 'e2e-test-facebook-client-id',
        AUTHENT_FACEBOOK_CLIENTSECRET: 'e2e-test-facebook-client-secret',
        AUTHENT_FACEBOOK_CALLBACKURL: 'http://localhost:4200/assets/logged.html',
        AUTHENT_GOOGLE_CLIENTID: 'e2e-test-google-client-id',
        AUTHENT_GOOGLE_CLIENTSECRET: 'e2e-test-google-client-secret',
        AUTHENT_GOOGLE_CALLBACKURL: 'http://localhost:4200/assets/logged.html',
        AUTHENT_GOOGLE_ANDROID_CLIENTID: 'e2e-test-google-android-client-id',
        // Swap the real `mongodb` driver for a no-op in-memory stub (see
        // ./mongo-stub) so the API doesn't crash on an unreachable MongoDB
        // while this read-only suite runs.
        NODE_OPTIONS: `--require ${path.resolve(__dirname, 'mongo-stub/register.js')}`,
      },
    },
    {
      command: 'npx nx serve frontend',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
