import type { CampaignPlan } from '../models/campaign.js';

interface CampaignRecord {
  id: string;
  brief: string;
  plan?: CampaignPlan;
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

  get(id: string): CampaignRecord | undefined {
    return this.campaigns.get(id);
  }
}
