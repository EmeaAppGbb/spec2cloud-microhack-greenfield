import type { CampaignPlan } from '../models/campaign.js';

const PLAN_DEFAULTS = {
  platform: 'Instagram',
  targetAudience: 'General audience',
  tone: 'Professional',
} as const;

interface PlanValidationResult {
  valid: boolean;
  plan?: CampaignPlan;
  errors?: string[];
}

const REQUIRED_STRING_FIELDS: (keyof CampaignPlan)[] = [
  'campaignName',
  'objective',
  'targetAudience',
  'visualDirection',
  'tone',
  'platform',
];

const GENERIC_MESSAGES = [
  'Discover our latest offering',
  'Join our community',
];

export function validatePlan(plan: CampaignPlan): PlanValidationResult {
  const errors: string[] = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!plan[field]) {
      errors.push(field);
    }
  }

  // keyMessages validation
  let keyMessages = [...(plan.keyMessages ?? [])];
  const keyMessagesOriginallyInvalid =
    !Array.isArray(plan.keyMessages) || plan.keyMessages.length < 2;

  if (keyMessagesOriginallyInvalid) {
    errors.push('keyMessages');
  }

  // Pad to minimum of 2
  if (keyMessages.length === 0) {
    keyMessages = [...GENERIC_MESSAGES];
  } else {
    while (keyMessages.length < 2) {
      keyMessages.push(GENERIC_MESSAGES[keyMessages.length - 1] ?? GENERIC_MESSAGES[0]);
    }
  }

  // Truncate to max 5
  if (keyMessages.length > 5) {
    keyMessages = keyMessages.slice(0, 5);
  }

  const adjustedPlan: CampaignPlan = { ...plan, keyMessages };

  // String field errors determine invalidity; keyMessages padding resolves its error
  const stringFieldErrors = errors.filter((e) => e !== 'keyMessages');

  if (stringFieldErrors.length > 0) {
    return { valid: false, errors, plan: adjustedPlan };
  }

  return { valid: true, plan: adjustedPlan };
}

export function applyDefaults(plan: CampaignPlan): CampaignPlan {
  return {
    ...plan,
    platform: plan.platform || PLAN_DEFAULTS.platform,
    targetAudience: plan.targetAudience || PLAN_DEFAULTS.targetAudience,
    tone: plan.tone || PLAN_DEFAULTS.tone,
  };
}
