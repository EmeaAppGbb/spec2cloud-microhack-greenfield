import { type Express } from 'express';
import type { CampaignPlan } from '../models/campaign.js';
import { validateBrief } from '../services/brief-validation.js';
import { validatePlan, applyDefaults } from '../services/plan-validation.js';
import { runPlanner } from '../services/planner-agent.js';
import { CampaignStore } from '../store/campaign-store.js';
import { logger } from '../logger.js';

const store = new CampaignStore();

export function mapCampaignEndpoints(app: Express): void {
  app.post('/api/campaign', async (req, res) => {
    try {
      const { brief } = req.body;

      if (brief === undefined || brief === null || typeof brief !== 'string') {
        res.status(400).json({ error: 'Brief is required' });
        return;
      }

      const validation = validateBrief(brief);

      if (!validation.valid) {
        res.status(400).json({
          error: validation.error,
          minLength: validation.minLength,
          actualLength: validation.actualLength,
        });
        return;
      }

      const trimmedBrief = validation.trimmedBrief!;
      const id = store.create(trimmedBrief);

      try {
        const rawPlan = await runPlanner(trimmedBrief);
        const defaultedPlan = applyDefaults(rawPlan);
        const validated = validatePlan(defaultedPlan);
        if (validated.plan) {
          store.updatePlan(id, validated.plan);
        }
      } catch (err) {
        logger.error({ campaignId: id, err }, 'Planner agent failed');
      }

      res.status(201).json({
        campaignId: id,
        truncated: validation.truncated ?? false,
      });
    } catch (err) {
      logger.error({ err }, 'Unexpected error in POST /api/campaign');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/campaign/:campaignId/plan', (req, res) => {
    const { campaignId } = req.params;
    const campaign = store.get(campaignId);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (!campaign.plan) {
      res.status(404).json({ error: 'Plan not yet available' });
      return;
    }

    const plan = campaign.plan;
    const defaulted = applyDefaults(plan);
    const defaultsApplied = {
      platform: !plan.platform,
      targetAudience: !plan.targetAudience,
      tone: !plan.tone,
    };

    res.json({
      ...defaulted,
      defaultsApplied,
    });
  });

  // SSE streaming endpoint — delivers campaign events to frontend
  app.get('/api/campaign/:campaignId/stream', (req, res) => {
    const { campaignId } = req.params;
    const campaign = store.get(campaignId);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Stage: planning → active
    sendEvent('stage-transition', { stage: 'planning', status: 'active' });

    if (campaign.plan) {
      // Stream plan fields as tokens for realistic streaming UX
      const planSummary = formatPlanAsMarkdown(campaign.plan);
      const words = planSummary.split(' ');
      let tokenIndex = 0;

      const tokenInterval = setInterval(() => {
        if (tokenIndex < words.length) {
          const token = (tokenIndex === 0 ? '' : ' ') + words[tokenIndex];
          sendEvent('token', { token, agentId: 'planner' });
          tokenIndex++;
        } else {
          clearInterval(tokenInterval);

          // Send structured plan data
          sendEvent('structured', { type: 'plan', data: campaign.plan });

          // Stage: planning → completed
          sendEvent('stage-transition', { stage: 'planning', status: 'completed' });

          // Agent complete with handoff
          sendEvent('complete', { agentId: 'planner', nextAgent: 'creative-generator' });

          res.end();
        }
      }, 30); // 30ms per word for visible streaming effect
    } else {
      sendEvent('status', { message: 'Planning failed — no plan available.', agentId: 'planner' });
      sendEvent('stage-transition', { stage: 'planning', status: 'pending' });
      sendEvent('complete', { agentId: 'planner' });
      res.end();
    }

    // Clean up on client disconnect
    req.on('close', () => {
      res.end();
    });
  });
}

function formatPlanAsMarkdown(plan: CampaignPlan): string {
  const lines = [
    `**Campaign:** ${plan.campaignName}`,
    `**Objective:** ${plan.objective}`,
    `**Audience:** ${plan.targetAudience}`,
    `**Platform:** ${plan.platform}`,
    `**Tone:** ${plan.tone}`,
    `**Visual Direction:** ${plan.visualDirection}`,
    `**Key Messages:**`,
    ...plan.keyMessages.map((m, i) => `${i + 1}. ${m}`),
  ];
  return lines.join('\n');
}
