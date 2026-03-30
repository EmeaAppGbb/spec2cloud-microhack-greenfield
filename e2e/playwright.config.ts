import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : [
    {
      command: 'npx tsx src/index.ts',
      url: 'http://localhost:5001/health',
      reuseExistingServer: true,
      timeout: 30000,
      env: { PORT: '5001' },
      cwd: '../src/api',
    },
    {
      command: 'npx next build && cp -r public .next/standalone/src/web/public; cp -r .next/static .next/standalone/src/web/.next/static; node .next/standalone/src/web/server.js',
      url: 'http://localhost:3002',
      reuseExistingServer: true,
      timeout: 120000,
      env: { PORT: '3002', HOSTNAME: '0.0.0.0', NEXT_PUBLIC_API_URL: 'http://localhost:5001' },
      cwd: '../src/web',
    },
  ],
});
