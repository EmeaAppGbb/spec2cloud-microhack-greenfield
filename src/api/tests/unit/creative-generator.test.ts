import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCreativeGenerator } from '../../src/services/creative-generator.js';
import type { CampaignPlan } from '../../src/models/campaign.js';

// Mock OpenAI — never make real API calls in unit tests
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  return {
    default: class {
      chat = { completions: { create: mockCreate } };
      images = { generate: vi.fn() };
    },
    __mockChatCreate: mockCreate,
  };
});

function makeValidPlan(overrides: Partial<CampaignPlan> = {}): CampaignPlan {
  return {
    campaignName: 'Summer Sale',
    objective: 'Increase summer revenue by 20%',
    targetAudience: 'Young adults 18-35',
    keyMessages: ['Save big this summer', 'Limited time offers', 'Free shipping'],
    visualDirection: 'Bright, warm colors with lifestyle imagery',
    tone: 'Friendly and energetic',
    platform: 'Instagram',
    ...overrides,
  };
}

describe('Creative Generator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful generation', () => {
    it('should generate image, caption, and hashtags from campaign plan', async () => {
      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      const result = await runCreativeGenerator(input);

      expect(result.imageUrl).toBeDefined();
      expect(typeof result.imageUrl).toBe('string');
      expect(result.caption).toBeDefined();
      expect(typeof result.caption).toBe('string');
      expect(result.hashtags).toBeDefined();
      expect(Array.isArray(result.hashtags)).toBe(true);
    });

    it('should return caption between 100-300 characters', async () => {
      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      const result = await runCreativeGenerator(input);

      expect(result.caption.length).toBeGreaterThanOrEqual(100);
      expect(result.caption.length).toBeLessThanOrEqual(300);
    });

    it('should return 5-10 hashtags, each starting with #', async () => {
      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      const result = await runCreativeGenerator(input);

      expect(result.hashtags.length).toBeGreaterThanOrEqual(5);
      expect(result.hashtags.length).toBeLessThanOrEqual(10);
      for (const tag of result.hashtags) {
        expect(tag.startsWith('#')).toBe(true);
      }
    });

    it('should include iteration version in output', async () => {
      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 3,
      };

      const result = await runCreativeGenerator(input);

      expect(result.iteration).toBe(3);
    });

    it('should record generation duration in output', async () => {
      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      const result = await runCreativeGenerator(input);

      expect(result.durationMs).toBeDefined();
      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing plan fields with error', async () => {
      const input = {
        campaignId: 'test-campaign-id',
        plan: {
          campaignName: '',
          objective: '',
          targetAudience: '',
          keyMessages: [],
          visualDirection: '',
          tone: '',
          platform: '',
        } as CampaignPlan,
        iteration: 1,
      };

      await expect(runCreativeGenerator(input)).rejects.toThrow();
    });

    it('should retry on transient API errors (up to 3 attempts)', async () => {
      const openai = await import('openai');
      const mockCreate = (openai as unknown as { __mockChatCreate: ReturnType<typeof vi.fn> }).__mockChatCreate;

      // Simulate two transient failures then success
      let attempt = 0;
      mockCreate.mockImplementation(() => {
        attempt++;
        if (attempt <= 2) {
          throw new Error('Service temporarily unavailable');
        }
        return Promise.resolve({
          choices: [{ message: { content: 'Generated caption with enough characters to meet the minimum length requirement for creative output validation' } }],
        });
      });

      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      // Should eventually succeed after retries
      const result = await runCreativeGenerator(input);
      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should fail immediately on non-transient errors (invalid key, content policy)', async () => {
      const openai = await import('openai');
      const mockCreate = (openai as unknown as { __mockChatCreate: ReturnType<typeof vi.fn> }).__mockChatCreate;

      const authError = new Error('Invalid API key');
      (authError as Record<string, unknown>).status = 401;
      (authError as Record<string, unknown>).code = 'invalid_api_key';
      mockCreate.mockRejectedValue(authError);

      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      await expect(runCreativeGenerator(input)).rejects.toThrow();
      // Should NOT retry — only 1 call
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should preserve image when caption generation fails (step-level retry)', async () => {
      const openai = await import('openai');
      const mockCreate = (openai as unknown as { __mockChatCreate: ReturnType<typeof vi.fn> }).__mockChatCreate;

      // Image generation succeeds, caption generation fails then succeeds
      let captionAttempt = 0;
      mockCreate.mockImplementation((params: Record<string, unknown>) => {
        const messages = params.messages as Array<{ content: string }>;
        const isCaption = messages?.some(m =>
          typeof m.content === 'string' && m.content.toLowerCase().includes('caption'),
        );

        if (isCaption) {
          captionAttempt++;
          if (captionAttempt === 1) {
            throw new Error('Service temporarily unavailable');
          }
        }

        return Promise.resolve({
          choices: [{ message: { content: 'Generated content with sufficient length to pass the minimum character validation requirement for output' } }],
        });
      });

      const input = {
        campaignId: 'test-campaign-id',
        plan: makeValidPlan(),
        iteration: 1,
      };

      const result = await runCreativeGenerator(input);

      // Image should still be present even though caption had a transient failure
      expect(result.imageUrl).toBeDefined();
      expect(result.caption).toBeDefined();
    });
  });
});
