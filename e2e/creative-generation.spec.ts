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

    // After planner completes, Generating stage should become active
    await expect(async () => {
      const status = await campaign.getTimelineStageStatus('Generating');
      expect(status).toBe('active');
    }).toPass({ timeout: 15_000 });
  });

  test('shows status message during generation', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // First status message should appear when creative generation starts
    await expect(campaign.statusMessages.first()).toBeVisible({ timeout: 30_000 });
    await expect(campaign.statusMessages.first()).toContainText(/generating/i);
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
    }).toPass({ timeout: 15_000 });
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
    await expect(campaign.statusMessages.first()).toBeVisible({ timeout: 30_000 });
    await expect(campaign.statusMessages.first()).toContainText(/generating.*image/i);
  });

  test('shows follow-up status at ~15s if generation takes long enough', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // Wait for the 15-second follow-up status message
    const followUpMessage = page.getByTestId('status-message').filter({ hasText: /still working/i });
    // This message only appears if generation takes >15s; allow time for it
    await expect(followUpMessage).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('inc-02: Creative Generation — Error Handling', () => {
  test('shows error message and retry button on generation failure', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    // Intercept image generation API to force failures
    await page.route('**/api/campaign/*/generate-image', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // After all retries fail, error message and retry button should appear
    const errorMessage = page.locator('[data-testid="assistant-message"]').filter({ hasText: /failed|error/i });
    await expect(errorMessage).toBeVisible({ timeout: 90_000 });
    await expect(campaign.retryButton).toBeVisible();
  });
});
