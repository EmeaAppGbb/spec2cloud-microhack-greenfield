import type { CampaignPlan } from '../models/campaign.js';

/**
 * Stub planner agent — returns a hardcoded plan for the walking skeleton.
 * Will be replaced with LangGraph-based LLM planner in inc-02+.
 */
export async function runPlanner(brief: string): Promise<CampaignPlan> {
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
