import type { CampaignPlan } from '../models/campaign.js';

interface CreativeAssets {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  iterationVersion: number;
}

interface CreativeIteration {
  version: number;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  feedback?: string;
  generatedAt: string;
}

interface CampaignRecord {
  id: string;
  brief: string;
  plan?: CampaignPlan;
  creative?: CreativeAssets;
  creativeHistory?: CreativeIteration[];
}

export class CampaignStore {
  private campaigns = new Map<string, CampaignRecord>();

  create(brief: string): string {
    const id = crypto.randomUUID();
    this.campaigns.set(id, { id, brief });
    return id;
  }

  updatePlan(id: string, plan: CampaignPlan): void {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.plan = plan;
    }
  }

  updateCreative(id: string, creative: CreativeAssets, history: CreativeIteration[]): void {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.creative = creative;
      campaign.creativeHistory = history;
    }
  }

  get(id: string): CampaignRecord | undefined {
    return this.campaigns.get(id);
  }
}
