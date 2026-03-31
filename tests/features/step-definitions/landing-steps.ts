import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import assert from 'assert';

// ── Given steps — Page navigation ───────────────────────────────

Given('I am on the landing page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/`);
});

Given('I am on the login page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/login`);
});

Given('I am on the registration page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/register`);
});

Given('I am on any page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/`);
});

// NOTE: 'I am not authenticated' is defined in profile-steps.ts

// ── When steps — CTA and navigation interactions ────────────────

When('I click the {string} call-to-action button', async function (this: CustomWorld, name: string) {
  const button = this.page.getByRole('link', { name }).or(this.page.getByRole('button', { name }));
  await button.first().click();
});

When('I click the {string} button in the navigation bar', async function (this: CustomWorld, name: string) {
  const button = this.page.locator('nav').getByRole('button', { name });
  await button.click();
});

When('I click the {string} app name in the navigation bar', async function (this: CustomWorld, name: string) {
  const link = this.page.locator('nav').getByRole('link', { name });
  await link.first().click();
});

When('I visit any page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/`);
});

// ── Then steps — Content assertions ─────────────────────────────

Then('I should see the description {string}', async function (this: CustomWorld, description: string) {
  const locator = this.page.getByText(description);
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected to see description "${description}"`);
});

Then('I should see a {string} call-to-action button', async function (this: CustomWorld, name: string) {
  const locator = this.page.getByRole('link', { name }).or(this.page.getByRole('button', { name }));
  await locator.first().waitFor({ timeout: 5000 });
  assert.ok(await locator.first().isVisible(), `Expected to see "${name}" CTA`);
});

Then('I should see a {string} call-to-action link', async function (this: CustomWorld, name: string) {
  const locator = this.page.getByRole('link', { name });
  await locator.first().waitFor({ timeout: 5000 });
  assert.ok(await locator.first().isVisible(), `Expected to see "${name}" CTA link`);
});

Then('I should not see {string} or {string} call-to-action buttons', async function (this: CustomWorld, first: string, second: string) {
  for (const name of [first, second]) {
    const buttons = this.page.getByRole('button', { name, exact: true });
    const links = this.page.getByRole('link', { name, exact: true });
    const buttonCount = await buttons.count();
    const linkCount = await links.count();
    // Allow elements to exist but they should not be CTA-style visible, or not exist at all
    if (buttonCount > 0) {
      // Check if it's in a CTA context (main content, not nav)
      const mainButton = this.page.locator('main').getByRole('button', { name, exact: true });
      assert.strictEqual(await mainButton.count(), 0, `CTA button "${name}" should not be visible`);
    }
    if (linkCount > 0) {
      const mainLink = this.page.locator('main').getByRole('link', { name, exact: true });
      assert.strictEqual(await mainLink.count(), 0, `CTA link "${name}" should not be visible`);
    }
  }
});

// ── Then steps — Error and success messages ─────────────────────

Then('I should see the error message {string}', async function (this: CustomWorld, message: string) {
  const locator = this.page.getByText(message);
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected to see error message "${message}"`);
});

Then('I should see the success message {string}', async function (this: CustomWorld, message: string) {
  const locator = this.page.getByText(message);
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected to see success message "${message}"`);
});

Then('I should not see a success message', async function (this: CustomWorld) {
  // Check that common success text patterns are not visible
  const successLocator = this.page.locator('[role="alert"], [data-testid="success-message"]').filter({ hasText: /success/i });
  const count = await successLocator.count();
  if (count > 0) {
    const visible = await successLocator.first().isVisible();
    assert.ok(!visible, 'Success message should not be visible');
  }
});

// ── Then steps — Page location assertions ───────────────────────

Then('I should be on the {string} page', async function (this: CustomWorld, expectedPath: string) {
  await this.page.waitForURL(`**${expectedPath}*`, { timeout: 5000 });
  const url = new URL(this.page.url());
  assert.ok(url.pathname.startsWith(expectedPath), `Expected to be on "${expectedPath}" but on "${url.pathname}"`);
});

Then('I should remain on the login page', async function (this: CustomWorld) {
  const url = new URL(this.page.url());
  assert.ok(url.pathname.includes('/login'), `Expected to remain on login page but on "${url.pathname}"`);
});

Then('I should remain on the registration page', async function (this: CustomWorld) {
  const url = new URL(this.page.url());
  assert.ok(url.pathname.includes('/register'), `Expected to remain on registration page but on "${url.pathname}"`);
});

// ── Then steps — Button state assertions ────────────────────────

Then('the {string} button should be disabled', async function (this: CustomWorld, name: string) {
  const button = this.page.getByRole('button', { name });
  await button.waitFor({ timeout: 5000 });
  const disabled = await button.isDisabled();
  assert.ok(disabled, `Expected "${name}" button to be disabled`);
});

Then('the {string} button should show {string}', async function (this: CustomWorld, _name: string, text: string) {
  const button = this.page.getByRole('button', { name: text });
  await button.waitFor({ timeout: 5000 });
  assert.ok(await button.isVisible(), `Expected button to show "${text}"`);
});

// ── Then steps — Page links ─────────────────────────────────────

Then('I should see a link {string} to {string}', async function (this: CustomWorld, linkText: string, href: string) {
  const link = this.page.locator(`a[href="${href}"]`).filter({ hasText: linkText }).first();
  await link.waitFor({ timeout: 5000 });
  assert.ok(await link.isVisible(), `Expected to see link "${linkText}" to "${href}"`);
});

// ── Then steps — Navigation bar ─────────────────────────────────

Then('the navigation bar should show the app name {string}', async function (this: CustomWorld, appName: string) {
  const nav = this.page.locator('nav');
  await nav.waitFor({ timeout: 5000 });
  const nameLocator = nav.getByText(appName);
  await nameLocator.waitFor({ timeout: 5000 });
  assert.ok(await nameLocator.isVisible(), `Expected NavBar to show app name "${appName}"`);
});

Then('the navigation bar should show {string} and {string} links', async function (this: CustomWorld, first: string, second: string) {
  const nav = this.page.locator('nav');
  for (const linkText of [first, second]) {
    const link = nav.getByRole('link', { name: linkText }).or(nav.getByRole('button', { name: linkText }));
    await link.first().waitFor({ timeout: 5000 });
    assert.ok(await link.first().isVisible(), `Expected NavBar to show "${linkText}" link`);
  }
});

Then('the navigation bar should show {string}, {string}, and {string} links', async function (this: CustomWorld, first: string, second: string, third: string) {
  const nav = this.page.locator('nav');
  for (const linkText of [first, second, third]) {
    const link = nav.getByRole('link', { name: linkText }).or(nav.getByRole('button', { name: linkText }));
    await link.first().waitFor({ timeout: 5000 });
    assert.ok(await link.first().isVisible(), `Expected NavBar to show "${linkText}" link`);
  }
});

Then('the navigation bar should not show {string} or {string} links', async function (this: CustomWorld, first: string, second: string) {
  const nav = this.page.locator('nav');
  for (const linkText of [first, second]) {
    const count = await nav.getByRole('link', { name: linkText, exact: true }).count();
    assert.strictEqual(count, 0, `Expected NavBar NOT to show "${linkText}" link`);
  }
});

Then('the navigation bar should not show {string}, {string}, or {string} links', async function (this: CustomWorld, first: string, second: string, third: string) {
  const nav = this.page.locator('nav');
  for (const linkText of [first, second, third]) {
    const linkCount = await nav.getByRole('link', { name: linkText, exact: true }).count();
    const buttonCount = await nav.getByRole('button', { name: linkText, exact: true }).count();
    assert.strictEqual(linkCount + buttonCount, 0, `Expected NavBar NOT to show "${linkText}"`);
  }
});

Then('no navigation links should be visible until the auth check completes', async function (this: CustomWorld) {
  // Intercept auth check to observe transient loading state
  await this.page.route('**/api/auth/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });
  await this.page.reload({ waitUntil: 'domcontentloaded' });
  // During loading, nav links should not be present
  const nav = this.page.locator('nav');
  const linkCount = await nav.getByRole('link').count();
  // The app name link may be present, so we just check auth-specific links are absent
  const loginCount = await nav.getByRole('link', { name: 'Login' }).count();
  const boardCount = await nav.getByRole('link', { name: 'Board' }).count();
  assert.strictEqual(loginCount + boardCount, 0, 'Auth-dependent nav links should not be visible during loading');
  await this.page.unroute('**/api/auth/me');
});
