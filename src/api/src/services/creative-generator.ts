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

function hasAzureOpenAI(): boolean {
  return !!process.env.AZURE_OPENAI_ENDPOINT;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createAzureClient(): Promise<any> {
  const { AzureOpenAI } = await import('openai');
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;

  if (apiKey) {
    return new AzureOpenAI({ endpoint, apiKey, apiVersion: '2025-04-01-preview' });
  }

  const { DefaultAzureCredential, getBearerTokenProvider } = await import('@azure/identity');
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    'https://cognitiveservices.azure.com/.default',
  );
  return new AzureOpenAI({ endpoint, azureADTokenProvider, apiVersion: '2025-04-01-preview' });
}


async function generateImageWithAI(
  plan: CampaignPlan,
  campaignId: string,
  iteration: number,
): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;

  logger.info({ campaignId, model: 'gpt-image-1-5' }, 'Starting AI image generation');

  // Use direct REST call — openai SDK v6 routes to Responses API which conflicts with deployment names
  const { DefaultAzureCredential } = await import('@azure/identity');
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

  const url = `${endpoint}openai/deployments/gpt-image-1-5/images/generations?api-version=2025-04-01-preview`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.token}`,
    },
    body: JSON.stringify({
      prompt: `Create a ${plan.tone} marketing image for "${plan.campaignName}". Visual direction: ${plan.visualDirection}. Platform: ${plan.platform}. Target audience: ${plan.targetAudience}. Professional, high-quality, suitable for social media marketing.`,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error({ campaignId, status: response.status, body: errText }, 'Image API error');
    throw new Error(`Image generation failed: ${response.status} ${errText}`);
  }

  const result = await response.json() as { data: Array<{ b64_json?: string; url?: string }> };
  const imageData = result.data?.[0];

  if (imageData?.b64_json) {
    logger.info({ campaignId, size: imageData.b64_json.length }, 'AI image generated (b64_json)');
    const buffer = Buffer.from(imageData.b64_json, 'base64');
    const stored = await saveImage(campaignId, iteration, buffer, 'image/png');
    return stored.url;
  }

  if (imageData?.url) {
    logger.info({ campaignId }, 'AI image generated (url) — downloading');
    const imgResp = await fetch(imageData.url);
    if (imgResp.ok) {
      const buffer = Buffer.from(await imgResp.arrayBuffer());
      const stored = await saveImage(campaignId, iteration, buffer, 'image/png');
      return stored.url;
    }
  }

  logger.warn({ campaignId, keys: Object.keys(imageData ?? {}) }, 'Unexpected image response — using stub');
  const stored = await saveImage(campaignId, iteration, STUB_PNG, 'image/png');
  return stored.url;
}

async function generateCaptionWithAI(plan: CampaignPlan): Promise<string> {
  const client = await createAzureClient();

  const response = await client.chat.completions.create({
    model: 'gpt-5-4-mini',
    messages: [
      {
        role: 'system' as const,
        content: `Generate a marketing caption for a ${plan.platform} campaign. Tone: ${plan.tone}. Target: ${plan.targetAudience}. The caption MUST be between ${CREATIVE_CONSTRAINTS.captionMinLength} and ${CREATIVE_CONSTRAINTS.captionMaxLength} characters. Respond with ONLY the caption text, no quotes.`,
      },
      {
        role: 'user' as const,
        content: `Campaign: ${plan.campaignName}. Key messages: ${plan.keyMessages.join(', ')}. Visual: ${plan.visualDirection}.`,
      },
    ],
  }) as unknown as ChatResponse;

  return response.choices[0]?.message?.content ?? '';
}

async function generateHashtagsWithAI(plan: CampaignPlan): Promise<string[]> {
  const client = await createAzureClient();

  const response = await client.chat.completions.create({
    model: 'gpt-5-4-mini',
    messages: [
      {
        role: 'system' as const,
        content: `Generate ${CREATIVE_CONSTRAINTS.hashtagsMin}-${CREATIVE_CONSTRAINTS.hashtagsMax} relevant hashtags for a ${plan.platform} marketing campaign. Each hashtag must start with #. Respond with ONLY the hashtags separated by spaces, nothing else.`,
      },
      {
        role: 'user' as const,
        content: `Campaign: ${plan.campaignName}. Target: ${plan.targetAudience}. Tone: ${plan.tone}. Key messages: ${plan.keyMessages.join(', ')}.`,
      },
    ],
  }) as unknown as ChatResponse;

  const raw = response.choices[0]?.message?.content ?? '';
  const tags = raw.split(/\s+/).filter(t => t.startsWith('#') && t.length > 1);

  if (tags.length >= CREATIVE_CONSTRAINTS.hashtagsMin && tags.length <= CREATIVE_CONSTRAINTS.hashtagsMax) {
    return tags;
  }

  return generateStubHashtags(plan);
}

export async function runCreativeGenerator(
  input: CreativeGeneratorInput,
): Promise<CreativeGeneratorResult> {
  const startTime = Date.now();
  const { campaignId, plan, iteration } = input;

  validatePlanFields(plan);

  const useAI = hasAzureOpenAI();

  // --- Image generation ---
  let imageUrl: string;
  if (useAI) {
    try {
      imageUrl = await callWithRetry(
        () => generateImageWithAI(plan, campaignId, iteration),
        CREATIVE_CONSTRAINTS.maxRetryAttempts,
      );
      logger.info({ campaignId, iteration }, 'AI image generated');
    } catch (err) {
      logger.error({ err, campaignId, iteration, message: (err as Error)?.message, stack: (err as Error)?.stack }, 'AI image generation failed — using stub image');
      const result = await saveImage(campaignId, iteration, STUB_PNG, 'image/png');
      imageUrl = result.url;
    }
  } else {
    const result = await saveImage(campaignId, iteration, STUB_PNG, 'image/png');
    imageUrl = result.url;
  }

  // --- Caption generation ---
  let caption: string;
  try {
    if (useAI) {
      const rawCaption = await callWithRetry(
        () => generateCaptionWithAI(plan),
        CREATIVE_CONSTRAINTS.maxRetryAttempts,
      );

      if (rawCaption.length >= CREATIVE_CONSTRAINTS.captionMinLength &&
          rawCaption.length <= CREATIVE_CONSTRAINTS.captionMaxLength) {
        caption = rawCaption;
      } else {
        caption = generateStubCaption(plan);
      }
    } else {
      // Dynamic import path — mocked in unit tests, real in production
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
    }
  } catch (err) {
    if (!isTransientError(err)) {
      throw err;
    }
    caption = generateStubCaption(plan);
  }

  // --- Hashtag generation ---
  let hashtags: string[];
  if (useAI) {
    try {
      hashtags = await callWithRetry(
        () => generateHashtagsWithAI(plan),
        CREATIVE_CONSTRAINTS.maxRetryAttempts,
      );
    } catch {
      hashtags = generateStubHashtags(plan);
    }
  } else {
    hashtags = generateStubHashtags(plan);
  }

  const durationMs = Date.now() - startTime || 1;

  return {
    imageUrl,
    caption,
    hashtags,
    iteration,
    durationMs,
  };
}
