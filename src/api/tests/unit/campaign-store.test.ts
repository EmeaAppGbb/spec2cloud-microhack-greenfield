import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignStore } from '../../src/store/campaign-store.js';
import type { CampaignPlan } from '../../src/models/campaign.js';

describe('Campaign Store', () => {
  let store: CampaignStore;

  beforeEach(() => {
    store = new CampaignStore();
  });

  describe('create — new campaign records', () => {
    it('should create a new campaign with a brief and return an ID', () => {
      const id = store.create('Launch a summer marketing campaign');
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should return unique IDs for different campaigns', () => {
      const id1 = store.create('First campaign brief for testing');
      const id2 = store.create('Second campaign brief for testing');
      expect(id1).not.toBe(id2);
    });
  });

  describe('updatePlan — attach plan data to a campaign', () => {
    it('should update a campaign with plan data after planning completes', () => {
      const id = store.create('Launch a summer marketing campaign');
      const plan: CampaignPlan = {
        campaignName: 'Summer Sale',
        objective: 'Increase revenue',
        targetAudience: 'Young adults 18-35',
        keyMessages: ['Save big', 'Limited time'],
        visualDirection: 'Bright warm colors',
        tone: 'Friendly',
        platform: 'Instagram',
      };

      store.updatePlan(id, plan);

      const campaign = store.get(id);
      expect(campaign).toBeDefined();
      expect(campaign!.plan).toEqual(plan);
    });
  });

  describe('get — retrieve campaign by ID', () => {
    it('should retrieve a campaign by ID with the brief', () => {
      const brief = 'Launch a comprehensive winter marketing campaign';
      const id = store.create(brief);
      const campaign = store.get(id);

      expect(campaign).toBeDefined();
      expect(campaign!.brief).toBe(brief);
    });

    it('should retrieve a campaign with full data including plan', () => {
      const id = store.create('Launch a holiday marketing campaign');
      const plan: CampaignPlan = {
        campaignName: 'Holiday Special',
        objective: 'Drive holiday sales',
        targetAudience: 'Families',
        keyMessages: ['Family fun', 'Great deals', 'Holiday cheer'],
        visualDirection: 'Festive colors and decorations',
        tone: 'Warm and inviting',
        platform: 'Facebook',
      };
      store.updatePlan(id, plan);

      const campaign = store.get(id);
      expect(campaign!.id).toBe(id);
      expect(campaign!.brief).toBe('Launch a holiday marketing campaign');
      expect(campaign!.plan).toEqual(plan);
    });

    it('should return null or undefined for a non-existent campaign ID', () => {
      const campaign = store.get('non-existent-id-12345');
      expect(campaign == null).toBe(true);
    });
  });

  describe('isolation', () => {
    it('should not share state between separate store instances', () => {
      const store1 = new CampaignStore();
      const store2 = new CampaignStore();

      const id = store1.create('Campaign in store 1 only');
      expect(store1.get(id)).toBeDefined();
      expect(store2.get(id) == null).toBe(true);
    });
  });
});
