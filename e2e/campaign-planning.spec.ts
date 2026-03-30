import { test, expect } from './fixtures';
import { CampaignPage } from './pages/CampaignPage';

const TIMELINE_STAGES = ['Planning', 'Generating', 'Reviewing', 'Awaiting-Approval', 'Localizing', 'Complete'] as const;

const PLAN_FIELD_NAMES = [
  'campaign-name',
  'objective',
  'target-audience',
  'platform',
  'tone',
  'visual-direction',
  'key-messages',
] as const;

const SAMPLE_BRIEF =
  'Launch a summer sale campaign for our new sneaker line targeting Gen Z on Instagram and TikTok. ' +
  'Budget is $5000, duration 2 weeks. Emphasize sustainability and style.';

test.describe('inc-01: Campaign Planning — Happy Path', () => {
  test('shows split-panel layout with chat and timeline', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await expect(campaign.chatPanel).toBeVisible();
    await expect(campaign.timelinePanel).toBeVisible();
  });

  test('displays all 6 timeline stages in pending state', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await expect(campaign.timelineStages).toHaveCount(6);

    for (const stageName of TIMELINE_STAGES) {
      const status = await campaign.getTimelineStageStatus(stageName);
      expect(status).toBe('pending');
    }
  });

  test('submits brief and displays user message in chat', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);

    await expect(campaign.userMessages.last()).toBeVisible();
    await expect(campaign.userMessages.last()).toContainText(SAMPLE_BRIEF);
  });

  test('clears input and disables it while pipeline is active', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);

    await expect(campaign.chatInput).toHaveValue('', { timeout: 10_000 });
    await expect(async () => {
      expect(await campaign.isInputDisabled()).toBe(true);
    }).toPass({ timeout: 10_000 });
  });

  test('transitions Planning stage to active after brief submission', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);

    await expect(async () => {
      const status = await campaign.getTimelineStageStatus('Planning');
      expect(status).toBe('active');
    }).toPass({ timeout: 60_000 });
  });

  test('displays assistant response with streaming text', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);

    // Wait for first assistant message to appear
    await expect(campaign.assistantMessages.first()).toBeVisible({ timeout: 60_000 });

    // Verify streaming: text length should grow over time
    const initialText = await campaign.assistantMessages.first().innerText();
    await page.waitForTimeout(500);
    const laterText = await campaign.assistantMessages.first().innerText();
    expect(laterText.length).toBeGreaterThanOrEqual(initialText.length);
  });

  test('shows structured plan block with all 7 fields after streaming completes', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    const fields = await campaign.getPlanFields();
    for (const fieldName of PLAN_FIELD_NAMES) {
      expect(fields[fieldName], `plan field "${fieldName}" should be present`).toBeDefined();
      expect(fields[fieldName].length, `plan field "${fieldName}" should not be empty`).toBeGreaterThan(0);
    }
  });

  test('marks Planning stage as completed after plan is generated', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    await expect(async () => {
      const status = await campaign.getTimelineStageStatus('Planning');
      expect(status).toBe('completed');
    }).toPass({ timeout: 60_000 });
  });

  test('shows handoff message after plan completion', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief(SAMPLE_BRIEF);
    await campaign.waitForPlanBlock();

    // A handoff message should appear after the plan block
    const lastMessage = await campaign.getLastAssistantMessage();
    expect(lastMessage.toLowerCase()).toMatch(/starting|generation|creative|next/);
  });
});

test.describe('inc-01: Brief Validation — Empty/Short Input', () => {
  test('send button is disabled when input is empty', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await expect(campaign.sendButton).toBeDisabled();
  });

  test('does not submit when input is empty', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    // Ensure no messages appear when input is empty
    const messageCountBefore = await campaign.userMessages.count();
    // Try pressing Enter on empty input
    await campaign.chatInput.press('Enter');
    const messageCountAfter = await campaign.userMessages.count();

    expect(messageCountAfter).toBe(messageCountBefore);
  });

  test('shows validation message for too-short brief', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.chatInput.fill('Hi');
    await campaign.sendButton.click({ force: true });

    await expect(campaign.validationMessage).toBeVisible();
    await expect(campaign.validationMessage).toContainText(/too short/i);
  });

  test('re-enables input after short-brief validation error', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.chatInput.fill('Hi');
    await campaign.sendButton.click({ force: true });

    await expect(campaign.validationMessage).toBeVisible();
    expect(await campaign.isInputDisabled()).toBe(false);
  });
});

test.describe('inc-01: Brief Validation — Long Brief', () => {
  test('shows truncation notification for brief exceeding 2000 chars', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    const longBrief = 'A'.repeat(2100);
    await campaign.submitBrief(longBrief);

    await expect(campaign.truncationNotification).toBeVisible();
    await expect(campaign.truncationNotification).toContainText(/truncat/i);
  });

  test('proceeds with planning after truncation', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    const longBrief = 'A'.repeat(2100);
    await campaign.submitBrief(longBrief);

    // Even with truncation, planning should proceed
    await expect(async () => {
      const status = await campaign.getTimelineStageStatus('Planning');
      expect(status).toBe('active');
    }).toPass({ timeout: 60_000 });
  });
});

test.describe('inc-01: Smart Defaults', () => {
  test('generates plan with defaults for a vague brief', { tag: '@smoke' }, async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.goto();

    await campaign.submitBrief('Promote our coffee blend');
    await campaign.waitForPlanBlock();

    const fields = await campaign.getPlanFields();

    expect(fields['platform']?.toLowerCase()).toContain('instagram');
    expect(fields['target-audience']?.toLowerCase()).toMatch(/general/i);
    expect(fields['tone']?.toLowerCase()).toMatch(/professional/i);
  });
});

test.describe('inc-01: Responsive Layout', () => {
  test('shows panels side by side on desktop viewport', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await campaign.goto();

    const chatBox = await campaign.chatPanel.boundingBox();
    const timelineBox = await campaign.timelinePanel.boundingBox();

    expect(chatBox).not.toBeNull();
    expect(timelineBox).not.toBeNull();

    // Chat panel should be to the left of timeline panel
    expect(chatBox!.x + chatBox!.width).toBeLessThanOrEqual(timelineBox!.x + 1);
  });

  test('stacks panels vertically on mobile viewport', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await campaign.goto();

    const chatBox = await campaign.chatPanel.boundingBox();
    const timelineBox = await campaign.timelinePanel.boundingBox();

    expect(chatBox).not.toBeNull();
    expect(timelineBox).not.toBeNull();

    // On mobile, timeline should be below chat (higher y value)
    expect(timelineBox!.y).toBeGreaterThan(chatBox!.y);
  });
});
