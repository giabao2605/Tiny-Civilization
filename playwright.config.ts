import { defineConfig, devices } from '@playwright/test';

const pagesProduction = process.env.PLAYWRIGHT_PRODUCTION === 'true';
const localProduction = process.env.PLAYWRIGHT_LOCAL_PRODUCTION === 'true';
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
    baseURL: pagesProduction ? address + '/Tiny-Civilization/' : address,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: pagesProduction
      ? 'GITHUB_PAGES=true npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
      : localProduction
        ? 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
        : 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: pagesProduction ? address + '/Tiny-Civilization/' : address,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
