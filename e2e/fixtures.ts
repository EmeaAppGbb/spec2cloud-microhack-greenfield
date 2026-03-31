import { test as base } from '@playwright/test';

// Extended test fixture that resets the in-memory user store before each test
export const test = base.extend({
  page: async ({ page }, use) => {
    // Reset the user store before each test for isolation
    const apiUrl = process.env.PLAYWRIGHT_API_URL
      || (process.env.PLAYWRIGHT_BASE_URL
        ? new URL(process.env.PLAYWRIGHT_BASE_URL).origin.replace(':3000', ':5001').replace(':3001', ':5001')
        : 'http://localhost:5001');
    try {
      await page.request.post(`${apiUrl}/api/test/reset`, { timeout: 5000 });
    } catch {
      // Reset endpoint may not be available in production — tests must be self-contained
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
