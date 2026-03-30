import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveImage, getImage } from '../../src/services/image-storage.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const TEST_STORAGE_DIR = path.join(process.cwd(), '.test-image-storage');

describe('Image Storage Service', () => {
  beforeEach(() => {
    // Ensure clean test directory
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });

    // Set storage root for tests via env var
    process.env.IMAGE_STORAGE_DIR = TEST_STORAGE_DIR;
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true });
    }
    delete process.env.IMAGE_STORAGE_DIR;
  });

  describe('saveImage', () => {
    it('should save image to filesystem with correct path ({campaignId}/{version}.png)', async () => {
      const campaignId = 'campaign-abc-123';
      const version = 1;
      const imageData = Buffer.from('fake-png-data');
      const mimeType = 'image/png';

      const result = await saveImage(campaignId, version, imageData, mimeType);

      expect(result).toBeDefined();
      expect(result.path).toBeDefined();

      // Verify file exists on disk at expected path
      const expectedPath = path.join(TEST_STORAGE_DIR, campaignId, `${version}.png`);
      expect(fs.existsSync(expectedPath)).toBe(true);

      // Verify file content matches
      const savedData = fs.readFileSync(expectedPath);
      expect(savedData).toEqual(imageData);
    });

    it('should generate correct servable URL', async () => {
      const campaignId = 'campaign-url-test';
      const version = 2;
      const imageData = Buffer.from('fake-png-data');
      const mimeType = 'image/png';

      const result = await saveImage(campaignId, version, imageData, mimeType);

      expect(result.url).toBeDefined();
      expect(typeof result.url).toBe('string');
      // URL should contain campaign ID and version for serving
      expect(result.url).toContain(campaignId);
      expect(result.url).toContain(String(version));
    });

    it('should handle concurrent saves for same campaign', async () => {
      const campaignId = 'campaign-concurrent';
      const imageData1 = Buffer.from('version-1-data');
      const imageData2 = Buffer.from('version-2-data');
      const mimeType = 'image/png';

      // Save two versions concurrently
      const [result1, result2] = await Promise.all([
        saveImage(campaignId, 1, imageData1, mimeType),
        saveImage(campaignId, 2, imageData2, mimeType),
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Both files should exist
      const path1 = path.join(TEST_STORAGE_DIR, campaignId, '1.png');
      const path2 = path.join(TEST_STORAGE_DIR, campaignId, '2.png');
      expect(fs.existsSync(path1)).toBe(true);
      expect(fs.existsSync(path2)).toBe(true);

      // Contents should be distinct
      expect(fs.readFileSync(path1)).toEqual(imageData1);
      expect(fs.readFileSync(path2)).toEqual(imageData2);
    });
  });

  describe('getImage', () => {
    it('should return stored image by campaign ID and version', async () => {
      const campaignId = 'campaign-get-test';
      const version = 1;
      const imageData = Buffer.from('retrievable-png-data');
      const mimeType = 'image/png';

      await saveImage(campaignId, version, imageData, mimeType);

      const result = await getImage(campaignId, version);

      expect(result).not.toBeNull();
      expect(result!.data).toEqual(imageData);
      expect(result!.mimeType).toBe(mimeType);
    });

    it('should return null for non-existent image', async () => {
      const result = await getImage('non-existent-campaign', 999);

      expect(result).toBeNull();
    });
  });
});
