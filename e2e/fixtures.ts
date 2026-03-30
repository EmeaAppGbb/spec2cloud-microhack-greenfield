import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    // After test, capture final screenshot for docs
    if (process.env.GENERATE_SCREENSHOTS === 'true' || testInfo.status === 'passed') {
      const docsDir = path.resolve(process.cwd(), 'docs', 'screenshots');
      const suiteName = slugify(testInfo.titlePath[1] || 'unknown');
      const testName = slugify(testInfo.title);
      const dir = path.join(docsDir, suiteName, testName);
      fs.mkdirSync(dir, { recursive: true });

      const screenshot = await page.screenshot({ fullPage: true });
      const status = testInfo.status === 'passed' ? 'passed' : 'failed';
      fs.writeFileSync(path.join(dir, `999-${status}.png`), screenshot);
    }
  },
});

export { expect };
