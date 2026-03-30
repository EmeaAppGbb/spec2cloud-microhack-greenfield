import type { CampaignPlan } from '../models/campaign.js';
import { applyDefaults } from './plan-validation.js';
import { logger } from '../logger.js';

/**
 * Planner agent — sends the user brief to Azure OpenAI gpt-5.4-mini
 * and returns a structured CampaignPlan. Falls back to a hardcoded stub
 * when the API key / endpoint is not configured (CI, unit tests).
 */

const SYSTEM_PROMPT = `You are a marketing campaign planner. Given a creative brief, generate a structured campaign plan as JSON with exactly these fields:
- campaignName (string): A catchy, memorable campaign name
- objective (string): The primary marketing objective
- targetAudience (string): Specific target demographic
- keyMessages (string[]): 2-5 key messages for the campaign
- visualDirection (string): Description of visual style and imagery
- tone (string): The tone of voice (e.g. professional, playful, bold)
- platform (string): Primary social media platform (e.g. Instagram, TikTok)

Respond ONLY with valid JSON. No markdown, no code fences, no explanation.`;

function stubPlan(brief: string): CampaignPlan {
  return {
    campaignName: 'Campaign Plan',
    objective: 'Drive engagement and brand awareness',
    targetAudience: brief.toLowerCase().includes('millennial')
      ? 'Millennials (25-40)'
      : 'General audience',
    keyMessages: [
      'Elevate your brand presence',
      'Connect with your audience authentically',
    ],
    visualDirection: 'Modern, clean, vibrant imagery with lifestyle photography',
    tone: brief.toLowerCase().includes('fun') ? 'playful' : 'professional',
    platform: brief.toLowerCase().includes('tiktok') ? 'TikTok' : 'Instagram',
  };
}

export async function runPlanner(brief: string): Promise<CampaignPlan> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint) {
    logger.info('AZURE_OPENAI_ENDPOINT not set — using stub planner');
    return applyDefaults(stubPlan(brief));
  }

  try {
    const { AzureOpenAI } = await import('openai');

    let clientOptions: ConstructorParameters<typeof AzureOpenAI>[0];
    if (apiKey) {
      clientOptions = { endpoint, apiKey, apiVersion: '2025-04-01-preview' };
    } else {
      const { DefaultAzureCredential, getBearerTokenProvider } = await import('@azure/identity');
      const credential = new DefaultAzureCredential();
      const azureADTokenProvider = getBearerTokenProvider(
        credential,
        'https://cognitiveservices.azure.com/.default',
      );
      clientOptions = { endpoint, azureADTokenProvider, apiVersion: '2025-04-01-preview' };
    }

    const client = new AzureOpenAI(clientOptions);

    const response = await client.chat.completions.create({
      model: 'gpt-5-4-mini',
      messages: [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        { role: 'user' as const, content: brief },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw) as CampaignPlan;

    // Ensure keyMessages is an array
    if (!Array.isArray(parsed.keyMessages)) {
      parsed.keyMessages = [];
    }

    logger.info({ campaignName: parsed.campaignName }, 'LLM planner succeeded');
    return applyDefaults(parsed);
  } catch (err) {
    logger.warn({ err }, 'LLM planner failed — falling back to stub');
    return applyDefaults(stubPlan(brief));
  }
}
