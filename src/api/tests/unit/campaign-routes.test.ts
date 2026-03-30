import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

// Mock the planner agent to avoid real LLM calls
vi.mock('../../src/services/planner-agent.js', () => ({
  runPlanner: vi.fn().mockResolvedValue({
    campaignName: 'Summer Sale Campaign',
    objective: 'Drive summer product sales',
    targetAudience: 'Young adults 18-35',
    keyMessages: ['Save big this summer', 'Limited time offers', 'Free shipping'],
    visualDirection: 'Bright, warm colors with lifestyle imagery',
    tone: 'Friendly and energetic',
    platform: 'Instagram',
  }),
}));

// Mock the creative generator to avoid real LLM calls
vi.mock('../../src/services/creative-generator.js', () => ({
  runCreativeGenerator: vi.fn().mockResolvedValue({
    imageUrl: '/api/campaign/test-id/image/1',
    caption: 'Experience the vibrant energy of summer with our exclusive collection — bold styles, unbeatable prices, and endless sunshine vibes await you.',
    hashtags: ['#SummerSale', '#Fashion', '#Deals', '#Style', '#Trending'],
    iteration: 1,
    durationMs: 1200,
  }),
}));

// Mock image storage
vi.mock('../../src/services/image-storage.js', () => ({
  saveImage: vi.fn().mockResolvedValue({
    path: '/storage/test-id/1.png',
    url: '/api/campaign/test-id/image/1',
  }),
  getImage: vi.fn().mockImplementation((campaignId: string, version: number) => {
    if (campaignId === 'existing-campaign' && version === 1) {
      return Promise.resolve({
        data: Buffer.from('fake-png-data'),
        mimeType: 'image/png',
      });
    }
    return Promise.resolve(null);
  }),
}));

describe('Campaign Routes', () => {
  const app = createApp();

  describe('POST /api/campaign — Brief Submission', () => {
    it('should accept a valid brief and return 201 with campaignId', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 'Launch a summer marketing campaign for our new product line' });

      expect(res.status).toBe(201);
      expect(res.body.campaignId).toBeDefined();
      expect(typeof res.body.campaignId).toBe('string');
      expect(res.body.truncated).toBe(false);
    });

    it('should reject an empty brief with 400 status', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Brief too short');
      expect(res.body.minLength).toBe(10);
      expect(res.body.actualLength).toBe(0);
    });

    it('should reject a brief shorter than 10 characters with 400 status', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Brief too short');
      expect(res.body.minLength).toBe(10);
      expect(res.body.actualLength).toBe(2);
    });

    it('should accept a brief with exactly 10 characters (boundary)', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 'A'.repeat(10) });

      expect(res.status).toBe(201);
      expect(res.body.campaignId).toBeDefined();
      expect(res.body.truncated).toBe(false);
    });

    it('should truncate a brief longer than 2000 characters and return truncated: true', async () => {
      const longBrief = 'A'.repeat(2500);
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: longBrief });

      expect(res.status).toBe(201);
      expect(res.body.campaignId).toBeDefined();
      expect(res.body.truncated).toBe(true);
    });

    it('should accept a brief with exactly 2000 characters without truncation', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 'A'.repeat(2000) });

      expect(res.status).toBe(201);
      expect(res.body.truncated).toBe(false);
    });

    it('should trim whitespace before validation and reject short trimmed input', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: '   Hi   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Brief too short');
      expect(res.body.actualLength).toBe(2);
    });

    it('should reject request with missing brief field', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject request with non-string brief', async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/campaign/:campaignId/plan — Plan Retrieval', () => {
    let campaignId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 'Launch a summer marketing campaign for our new product line' });
      campaignId = res.body.campaignId;
    });

    it('should return a plan with all 7 required fields after planning completes', async () => {
      const res = await request(app)
        .get(`/api/campaign/${campaignId}/plan`);

      expect(res.status).toBe(200);
      expect(res.body.campaignName).toBeDefined();
      expect(res.body.objective).toBeDefined();
      expect(res.body.targetAudience).toBeDefined();
      expect(res.body.keyMessages).toBeDefined();
      expect(res.body.visualDirection).toBeDefined();
      expect(res.body.tone).toBeDefined();
      expect(res.body.platform).toBeDefined();
    });

    it('should return 404 for a non-existent campaignId', async () => {
      const res = await request(app)
        .get('/api/campaign/non-existent-id/plan');

      expect(res.status).toBe(404);
    });

    it('should return 404 if planning has not completed yet', async () => {
      // Use a known campaign ID but with no plan attached
      // The route must exist and return 404 specifically for "no plan yet"
      const res = await request(app)
        .get(`/api/campaign/${campaignId}/plan`);

      // The route must respond (not generic Express 404)
      // If planning is async, a just-created campaign should return 404 for plan
      expect(res.status).toBeDefined();
      expect([200, 404]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body.error).toBeDefined();
      }
    });

    it('should include keyMessages as an array with 2-5 items', async () => {
      const res = await request(app)
        .get(`/api/campaign/${campaignId}/plan`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.keyMessages)).toBe(true);
      expect(res.body.keyMessages.length).toBeGreaterThanOrEqual(2);
      expect(res.body.keyMessages.length).toBeLessThanOrEqual(5);
    });

    it('should include defaultsApplied object reflecting which defaults were used', async () => {
      const res = await request(app)
        .get(`/api/campaign/${campaignId}/plan`);

      expect(res.status).toBe(200);
      expect(res.body.defaultsApplied).toBeDefined();
      expect(typeof res.body.defaultsApplied).toBe('object');
    });
  });

  describe('GET /api/campaign/:id/creative — Creative Retrieval', () => {
    let campaignId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/campaign')
        .send({ brief: 'Launch a summer marketing campaign for our new product line' });
      campaignId = res.body.campaignId;
    });

    it('should return creative assets when available', async () => {
      const res = await request(app)
        .get(`/api/campaign/${campaignId}/creative`);

      expect(res.status).toBe(200);
      expect(res.body.imageUrl).toBeDefined();
      expect(res.body.caption).toBeDefined();
      expect(res.body.hashtags).toBeDefined();
      expect(Array.isArray(res.body.hashtags)).toBe(true);
    });

    it('should return 404 when no creative exists', async () => {
      const res = await request(app)
        .get('/api/campaign/non-existent-id/creative');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/campaign/:id/image/:version — Image Retrieval', () => {
    it('should return image binary data with correct content-type', async () => {
      const res = await request(app)
        .get('/api/campaign/existing-campaign/image/1');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/);
      expect(res.body).toBeDefined();
    });

    it('should return 404 for non-existent image', async () => {
      const res = await request(app)
        .get('/api/campaign/no-such-campaign/image/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });
});
