import { defineConfig, devices } from '@playwright/test';

const production = process.env.PLAYWRIGHT_PRODUCTION === 'true';
const address = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // A single headless Chromium profile is less distorted by another heavy E2E worker.
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: production ? address + '/Tiny-Civilization/' : address,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: production
      ? 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
      : 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: production ? address + '/Tiny-Civilization/' : address,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
