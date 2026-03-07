import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'cd ../packages/api && npm run dev',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'cd ../packages/checkout-widget && npm run dev',
      port: 5174,
      reuseExistingServer: true,
    },
    {
      command: 'cd ../packages/admin-dashboard && npm run dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
