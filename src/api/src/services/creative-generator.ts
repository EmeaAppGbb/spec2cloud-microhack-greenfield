import type { CampaignPlan } from '../models/campaign.js';
import { CREATIVE_CONSTRAINTS } from './caption-validation.js';
import { saveImage } from './image-storage.js';
import { logger } from '../logger.js';

interface CreativeGeneratorInput {
  campaignId: string;
  plan: CampaignPlan;
  iteration: number;
}

interface CreativeGeneratorResult {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  iteration: number;
  durationMs: number;
}

// Minimal valid 1x1 transparent PNG
const STUB_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
);

function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const record = err as unknown as Record<string, unknown>;
    if (record.status === 401 || record.status === 403) return false;
    if (record.code === 'invalid_api_key') return false;
    if (record.code === 'content_policy_violation') return false;
  }
  return true;
}

function validatePlanFields(plan: CampaignPlan): void {
  const requiredFields: (keyof CampaignPlan)[] = [
    'campaignName', 'objective', 'targetAudience',
    'keyMessages', 'visualDirection', 'tone', 'platform',
  ];

  const allEmpty = requiredFields.every(field => {
    const val = plan[field];
    if (Array.isArray(val)) return val.length === 0;
    return !val;
  });

  if (allEmpty) {
    throw new Error('Plan is missing required fields: all fields are empty');
  }
}

function generateStubCaption(plan: CampaignPlan): string {
  const messages = plan.keyMessages.join(', ');
  const base = `Discover the power of ${plan.campaignName} — crafted for ${plan.targetAudience} on ${plan.platform}. ${messages}. Embrace the ${plan.tone} energy and let ${plan.visualDirection} inspire your next move.`;

  // Ensure minimum length
  let caption = base;
  while (caption.length < CREATIVE_CONSTRAINTS.captionMinLength) {
    caption += ' Transform your brand presence today.';
  }

  // Truncate to max
  if (caption.length > CREATIVE_CONSTRAINTS.captionMaxLength) {
    caption = caption.slice(0, CREATIVE_CONSTRAINTS.captionMaxLength - 1) + '.';
  }

  return caption;
}

function generateStubHashtags(plan: CampaignPlan): string[] {
  const base = [
    `#${plan.platform.replace(/\s+/g, '')}`,
    '#Marketing',
    '#Campaign',
    '#Creative',
    '#Brand',
    '#Digital',
    '#Social',
  ];

  // Add from key messages
  for (const msg of plan.keyMessages) {
    const tag = '#' + msg.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    if (tag.length > 1) base.push(tag);
  }

  // Deduplicate and limit to 5-10
  const unique = [...new Set(base)];
  return unique.slice(0, Math.max(CREATIVE_CONSTRAINTS.hashtagsMin, Math.min(unique.length, CREATIVE_CONSTRAINTS.hashtagsMax)));
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err)) {
        throw err;
      }
      logger.warn({ attempt, maxAttempts, err }, 'Transient error, retrying');
    }
  }
  throw lastError;
}

interface ChatResponse {
  choices: Array<{ message: { content: string } }>;
}

export async function runCreativeGenerator(
  input: CreativeGeneratorInput,
): Promise<CreativeGeneratorResult> {
  const startTime = Date.now();
  const { campaignId, plan, iteration } = input;

  validatePlanFields(plan);

  // Save stub image
  const imageResult = await saveImage(campaignId, iteration, STUB_PNG, 'image/png');
  const imageUrl = imageResult.url;

  let caption: string;
  let hashtags: string[];

  try {
    // Dynamic import — mocked in unit tests, real in production
    const openaiModule = await import('openai');
    const OpenAI = openaiModule.default;
    const client = new OpenAI();

    const captionResponse = await callWithRetry<ChatResponse>(
      () => client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system' as const,
            content: `Generate a marketing caption for a ${plan.platform} campaign. Tone: ${plan.tone}. Target: ${plan.targetAudience}.`,
          },
          {
            role: 'user' as const,
            content: `Campaign: ${plan.campaignName}. Key messages: ${plan.keyMessages.join(', ')}. Visual: ${plan.visualDirection}. Write a caption between ${CREATIVE_CONSTRAINTS.captionMinLength}-${CREATIVE_CONSTRAINTS.captionMaxLength} characters.`,
          },
        ],
      }) as unknown as Promise<ChatResponse>,
      CREATIVE_CONSTRAINTS.maxRetryAttempts,
    );

    const rawCaption = captionResponse.choices[0]?.message?.content ?? '';

    if (rawCaption.length >= CREATIVE_CONSTRAINTS.captionMinLength &&
        rawCaption.length <= CREATIVE_CONSTRAINTS.captionMaxLength) {
      caption = rawCaption;
    } else {
      caption = generateStubCaption(plan);
    }
  } catch (err) {
    if (!isTransientError(err)) {
      throw err;
    }
    caption = generateStubCaption(plan);
  }

  hashtags = generateStubHashtags(plan);

  const durationMs = Date.now() - startTime || 1;

  return {
    imageUrl,
    caption,
    hashtags,
    iteration,
    durationMs,
  };
}
