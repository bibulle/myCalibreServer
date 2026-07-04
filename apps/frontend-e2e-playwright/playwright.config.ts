import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Read-only Playwright e2e suite.
 *
 * Scope: only covers flows that do not require a user account (no MongoDB
 * dependency), so it can run anywhere without a running MongoDB instance -
 * unlike the existing Cypress suite (`apps/frontend-e2e`), whose
 * authenticated specs need one. See `apps/frontend-e2e-playwright/README.md`.
 */
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
        // This workspace pins a Playwright version that may not match the
        // Chromium revision pre-installed in some sandboxed environments;
        // point directly at it instead of letting Playwright resolve/download one.
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium',
        },
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
