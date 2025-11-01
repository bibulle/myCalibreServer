import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      bundler: 'webpack',
    }),
    baseUrl: 'http://localhost:4200',
    env: {
      apiUrl: 'http://localhost:3333/api',
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videosFolder: '../../dist/cypress/apps/frontend-e2e/videos',
    screenshotsFolder: '../../dist/cypress/apps/frontend-e2e/screenshots',
    chromeWebSecurity: false,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    specPattern: 'src/integration/**/*.{spec,cy}.{js,jsx,ts,tsx}',
    supportFile: 'src/support/index.ts',
  },
});
