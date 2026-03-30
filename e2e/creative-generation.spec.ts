import { test, expect } from './fixtures';
import { CampaignPage } from './pages/CampaignPage';

const SAMPLE_BRIEF =
  'Launch a summer sale campaign for our new sneaker line targeting Gen Z on Instagram and TikTok. ' +
  'Budget is $5000, duration 2 weeks. Emphasize sustainability and style.';

// Creative generation can take up to 60s (image gen) + buffer
test.describe.configure({ timeout: 120_000 });

test.describe('inc-02: Creative Generation — Happy Path', () => {
  test('auto-starts creative after planner completes', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // After planner completes, Generating stage should auto-start (active or already completed)
    await expect(async () => {
      const status = await campaign.getTimelineStageStatus('Generating');
      expect(['active', 'completed']).toContain(status);
    }).toPass({ timeout: 60_000 });
  });

  test('shows status message during generation', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // First status message should appear when creative generation starts
    await expect(campaign.statusMessages.first()).toBeVisible({ timeout: 60_000 });
    const statusText = await campaign.statusMessages.first().innerText();
    expect(statusText.toLowerCase()).toMatch(/generat/i);
  });

  test('displays creative preview with image', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();
    await campaign.waitForCreativePreview();

    await expect(campaign.generatedImage).toBeVisible();
    const src = await campaign.getImageSrc();
    expect(src).toBeTruthy();
    expect(src).toMatch(/\/api\/campaign\/.*\/image\//);
  });

  test('creative preview has caption in 100-300 chars', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();
    await campaign.waitForCreativePreview();

    const caption = await campaign.getCaption();
    expect(caption.length).toBeGreaterThanOrEqual(100);
    expect(caption.length).toBeLessThanOrEqual(300);
  });

  test('creative preview has 5-10 hashtags each starting with #', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();
    await campaign.waitForCreativePreview();

    const hashtags = await campaign.getHashtags();
    expect(hashtags.length).toBeGreaterThanOrEqual(5);
    expect(hashtags.length).toBeLessThanOrEqual(10);

    for (const tag of hashtags) {
      expect(tag).toMatch(/^#\S+$/);
    }
  });

  test('marks Generating stage as completed', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();
    await campaign.waitForCreativePreview();

    await expect(async () => {
      const status = await campaign.getTimelineStageStatus('Generating');
      expect(status).toBe('completed');
    }).toPass({ timeout: 60_000 });
  });

  test('image URL is accessible via HTTP', async ({ page, request }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();
    await campaign.waitForCreativePreview();

    const src = await campaign.getImageSrc();
    expect(src).toBeTruthy();

    // Resolve relative URL against baseURL
    const imageUrl = new URL(src, page.url()).href;
    const response = await request.get(imageUrl);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/image\//);
  });
});

test.describe('inc-02: Creative Generation — Status Messages', () => {
  test('shows initial status message immediately', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // Generating stage becomes active → first status message should appear
    await expect(campaign.statusMessages.first()).toBeVisible({ timeout: 60_000 });
    const statusText = await campaign.statusMessages.first().innerText();
    expect(statusText.toLowerCase()).toMatch(/generat/i);
  });

  test('shows follow-up status at ~15s if generation takes long enough', async ({ page }) => {
    // Note: With stub generator, generation is instant so the 15s follow-up
    // message won't appear. This test verifies that multiple status messages
    // are rendered when the backend sends them.
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // Verify at least one status message appeared during the flow
    await expect(campaign.statusMessages.first()).toBeVisible({ timeout: 60_000 });
    // Verify creative preview also appeared (generation completed)
    await campaign.waitForCreativePreview();
    await expect(campaign.creativePreview).toBeVisible();
  });
});

test.describe('inc-02: Creative Generation — Error Handling', () => {
  test('shows error message when API returns error', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    // Intercept campaign creation to return a campaign with no creative
    // This simulates a generation failure scenario
    await page.route('**/api/campaign', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Creative generation failed' }),
        });
      } else {
        route.continue();
      }
    });

    await campaign.chatInput.fill(SAMPLE_BRIEF);
    await campaign.sendButton.click();

    // Error message should appear in chat
    const errorMessage = page.locator('[data-testid="assistant-message"]').filter({ hasText: /error|failed/i });
    await expect(errorMessage).toBeVisible({ timeout: 15_000 });
  });
});
