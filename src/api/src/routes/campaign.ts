import { type Express } from 'express';
import type { CampaignPlan } from '../models/campaign.js';
import { validateBrief } from '../services/brief-validation.js';
import { validatePlan, applyDefaults } from '../services/plan-validation.js';
import { runPlanner } from '../services/planner-agent.js';
import { runCreativeGenerator } from '../services/creative-generator.js';
import { getImage } from '../services/image-storage.js';
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

          // Auto-trigger creative generation after planning
          try {
            const creativeResult = await runCreativeGenerator({
              campaignId: id,
              plan: validated.plan,
              iteration: 1,
            });

            store.updateCreative(id, {
              imageUrl: creativeResult.imageUrl,
              caption: creativeResult.caption,
              hashtags: creativeResult.hashtags,
              iterationVersion: creativeResult.iteration,
            }, [{
              version: creativeResult.iteration,
              imageUrl: creativeResult.imageUrl,
              caption: creativeResult.caption,
              hashtags: creativeResult.hashtags,
              generatedAt: new Date().toISOString(),
            }]);
          } catch (err) {
            logger.error({ campaignId: id, err }, 'Creative generator failed');
          }
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

  // Creative retrieval endpoint
  app.get('/api/campaign/:campaignId/creative', (req, res) => {
    const { campaignId } = req.params;
    const campaign = store.get(campaignId);

    if (!campaign || !campaign.creative) {
      res.status(404).json({ error: 'Creative not found' });
      return;
    }

    res.json(campaign.creative);
  });

  // Image serving endpoint
  app.get('/api/campaign/:campaignId/image/:version', async (req, res) => {
    const { campaignId, version } = req.params;
    const versionNum = parseInt(version, 10);

    try {
      const image = await getImage(campaignId, versionNum);

      if (!image) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      res.set('Content-Type', image.mimeType);
      res.send(image.data);
    } catch (err) {
      logger.error({ campaignId, version, err }, 'Error serving image');
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  });

  // Diagnostic endpoint — test Azure OpenAI image generation
  app.get('/api/debug/image-test', async (_req, res) => {
    try {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      if (!endpoint) {
        res.json({ error: 'AZURE_OPENAI_ENDPOINT not set' });
        return;
      }

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
          prompt: 'A simple red circle on a white background',
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        res.json({ error: errText, status: response.status });
        return;
      }

      const result = await response.json() as { data: Array<{ b64_json?: string; url?: string }> };
      const data = result.data?.[0];
      res.json({
        success: true,
        hasB64: !!data?.b64_json,
        hasUrl: !!data?.url,
        b64Length: data?.b64_json?.length ?? 0,
        keys: Object.keys(data ?? {}),
      });
    } catch (err) {
      const e = err as Error & { status?: number; code?: string; type?: string };
      res.json({
        error: e.message,
        status: e.status,
        code: e.code,
        type: e.type,
        name: e.name,
      });
    }
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
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') (res as any).flush();
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

          // Planner complete with handoff to creative
          sendEvent('complete', { agentId: 'planner', nextAgent: 'creative-generator' });

          // Stage: generating → active
          sendEvent('stage-transition', { stage: 'generating', status: 'active' });

          // Status message for creative generation
          sendEvent('status', { message: '🎨 Generating your campaign image…', agentId: 'creative-generator' });

          if (campaign.creative) {
            // Send creative preview
            sendEvent('structured', { type: 'creative-preview', data: campaign.creative });

            // Stage: generating → completed
            sendEvent('stage-transition', { stage: 'generating', status: 'completed' });

            // Creative complete with handoff
            sendEvent('complete', { agentId: 'creative-generator', nextAgent: 'copy-reviewer' });
          } else {
            sendEvent('complete', { agentId: 'creative-generator' });
          }

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
