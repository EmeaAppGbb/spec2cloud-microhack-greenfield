import { describe, it, expect } from 'vitest';
import {
  validatePlan,
  applyDefaults,
} from '../../src/services/plan-validation.js';
import type { CampaignPlan } from '../../src/models/campaign.js';

const PLAN_DEFAULTS = {
  platform: 'Instagram',
  targetAudience: 'General audience',
  tone: 'Professional',
};

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

describe('Plan Validation Service', () => {
  describe('validatePlan — field presence', () => {
    it('should validate a plan with all 7 required fields present', () => {
      const plan = makeValidPlan();
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
    });

    it('should reject a plan with missing campaignName', () => {
      const plan = makeValidPlan({ campaignName: '' });
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('campaignName');
    });

    it('should reject a plan with missing objective', () => {
      const plan = makeValidPlan({ objective: '' });
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('objective');
    });

    it('should reject a plan with missing targetAudience', () => {
      const plan = makeValidPlan({ targetAudience: '' });
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
    });

    it('should reject a plan with missing visualDirection', () => {
      const plan = makeValidPlan({ visualDirection: '' });
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
    });

    it('should reject a plan with missing tone', () => {
      const plan = makeValidPlan({ tone: '' });
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
    });

    it('should reject a plan with missing platform', () => {
      const plan = makeValidPlan({ platform: '' });
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
    });

    it('should reject a plan where all fields are empty strings', () => {
      const plan: CampaignPlan = {
        campaignName: '',
        objective: '',
        targetAudience: '',
        keyMessages: [],
        visualDirection: '',
        tone: '',
        platform: '',
      };
      const result = validatePlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors!.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('validatePlan — keyMessages constraints', () => {
    it('should accept keyMessages array with 2 items (minimum boundary)', () => {
      const plan = makeValidPlan({
        keyMessages: ['Message one', 'Message two'],
      });
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
    });

    it('should accept keyMessages array with 5 items (maximum boundary)', () => {
      const plan = makeValidPlan({
        keyMessages: ['A', 'B', 'C', 'D', 'E'],
      });
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
    });

    it('should accept keyMessages array with 3 items (mid-range)', () => {
      const plan = makeValidPlan({
        keyMessages: ['One', 'Two', 'Three'],
      });
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
    });

    it('should pad keyMessages if fewer than 2 items are provided', () => {
      const plan = makeValidPlan({ keyMessages: ['Only one'] });
      const result = validatePlan(plan);
      // After padding, should be valid with at least 2 messages
      expect(result.valid).toBe(true);
      expect(result.plan!.keyMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('should pad empty keyMessages array to minimum of 2', () => {
      const plan = makeValidPlan({ keyMessages: [] });
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
      expect(result.plan!.keyMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('should truncate keyMessages if more than 5 items are provided', () => {
      const plan = makeValidPlan({
        keyMessages: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      });
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
      expect(result.plan!.keyMessages.length).toBeLessThanOrEqual(5);
    });

    it('should ensure keyMessages are strings', () => {
      const plan = makeValidPlan({
        keyMessages: ['Valid message', 'Another valid one', 'Third'],
      });
      const result = validatePlan(plan);
      expect(result.valid).toBe(true);
      for (const msg of result.plan!.keyMessages) {
        expect(typeof msg).toBe('string');
      }
    });
  });

  describe('applyDefaults — smart default application', () => {
    it('should set platform to "Instagram" when platform is empty', () => {
      const plan = makeValidPlan({ platform: '' });
      const result = applyDefaults(plan);
      expect(result.platform).toBe(PLAN_DEFAULTS.platform);
    });

    it('should set targetAudience to "General audience" when empty', () => {
      const plan = makeValidPlan({ targetAudience: '' });
      const result = applyDefaults(plan);
      expect(result.targetAudience).toBe(PLAN_DEFAULTS.targetAudience);
    });

    it('should set tone to "Professional" when empty', () => {
      const plan = makeValidPlan({ tone: '' });
      const result = applyDefaults(plan);
      expect(result.tone).toBe(PLAN_DEFAULTS.tone);
    });

    it('should not override non-empty platform with default', () => {
      const plan = makeValidPlan({ platform: 'TikTok' });
      const result = applyDefaults(plan);
      expect(result.platform).toBe('TikTok');
    });

    it('should not override non-empty targetAudience with default', () => {
      const plan = makeValidPlan({ targetAudience: 'Senior professionals 45-60' });
      const result = applyDefaults(plan);
      expect(result.targetAudience).toBe('Senior professionals 45-60');
    });

    it('should not override non-empty tone with default', () => {
      const plan = makeValidPlan({ tone: 'Casual and fun' });
      const result = applyDefaults(plan);
      expect(result.tone).toBe('Casual and fun');
    });

    it('should apply all three defaults when all defaultable fields are empty', () => {
      const plan = makeValidPlan({
        platform: '',
        targetAudience: '',
        tone: '',
      });
      const result = applyDefaults(plan);
      expect(result.platform).toBe(PLAN_DEFAULTS.platform);
      expect(result.targetAudience).toBe(PLAN_DEFAULTS.targetAudience);
      expect(result.tone).toBe(PLAN_DEFAULTS.tone);
    });

    it('should not modify fields that do not have defaults (campaignName, objective, etc.)', () => {
      const plan = makeValidPlan({
        campaignName: 'My Campaign',
        objective: 'Sell more',
        visualDirection: 'Bold imagery',
      });
      const result = applyDefaults(plan);
      expect(result.campaignName).toBe('My Campaign');
      expect(result.objective).toBe('Sell more');
      expect(result.visualDirection).toBe('Bold imagery');
    });
  });
});
