import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Campaign Planning page (inc-01 Walking Skeleton).
 * Split-panel layout: chat panel (left) + timeline panel (right).
 */
export class CampaignPage {
  readonly page: Page;

  // Panel containers
  readonly chatPanel: Locator;
  readonly timelinePanel: Locator;

  // Chat input controls
  readonly chatInput: Locator;
  readonly sendButton: Locator;

  // Message lists
  readonly chatMessages: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;

  // Plan display
  readonly planBlock: Locator;

  // Timeline
  readonly timelineStages: Locator;
  readonly activeStage: Locator;
  readonly completedStages: Locator;

  // Validation
  readonly validationMessage: Locator;
  readonly truncationNotification: Locator;

  constructor(page: Page) {
    this.page = page;

    this.chatPanel = page.getByTestId('chat-panel');
    this.timelinePanel = page.getByTestId('timeline-panel');

    this.chatInput = page.getByTestId('chat-input');
    this.sendButton = page.getByTestId('send-button');

    this.chatMessages = page.getByTestId('chat-messages');
    this.userMessages = page.getByTestId('chat-messages').locator('[data-testid="user-message"]');
    this.assistantMessages = page.getByTestId('chat-messages').locator('[data-testid="assistant-message"]');

    this.planBlock = page.getByTestId('plan-block');

    this.timelineStages = page.getByTestId('timeline-panel').locator('[data-testid^="timeline-stage-"]');
    this.activeStage = page.getByTestId('timeline-panel').locator('[data-status="active"]');
    this.completedStages = page.getByTestId('timeline-panel').locator('[data-status="completed"]');

    this.validationMessage = page.getByTestId('validation-message');
    this.truncationNotification = page.getByTestId('truncation-notification');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.chatPanel.waitFor({ state: 'visible' });
  }

  async submitBrief(text: string): Promise<void> {
    await this.chatInput.fill(text);
    await this.sendButton.click();
  }

  async getTimelineStageStatus(stageName: string): Promise<string> {
    const stage = this.page.getByTestId(`timeline-stage-${stageName.toLowerCase()}`);
    const status = await stage.getAttribute('data-status');
    return status ?? 'unknown';
  }

  async waitForPlanBlock(): Promise<void> {
    await this.planBlock.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async getPlanFields(): Promise<Record<string, string>> {
    const fields: Record<string, string> = {};
    const fieldElements = this.planBlock.locator('[data-field]');
    const count = await fieldElements.count();

    for (let i = 0; i < count; i++) {
      const element = fieldElements.nth(i);
      const name = await element.getAttribute('data-field');
      const value = await element.innerText();
      if (name) {
        fields[name] = value;
      }
    }

    return fields;
  }

  async getLastAssistantMessage(): Promise<string> {
    const count = await this.assistantMessages.count();
    if (count === 0) {
      return '';
    }
    return this.assistantMessages.last().innerText();
  }

  async isInputDisabled(): Promise<boolean> {
    return this.chatInput.isDisabled();
  }
}
