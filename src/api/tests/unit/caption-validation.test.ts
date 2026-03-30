import { describe, it, expect } from 'vitest';
import {
  validateCaption,
  validateHashtags,
  CREATIVE_CONSTRAINTS,
} from '../../src/services/caption-validation.js';

describe('Caption Validation Service', () => {
  describe('CREATIVE_CONSTRAINTS', () => {
    it('should export CREATIVE_CONSTRAINTS with correct values', () => {
      expect(CREATIVE_CONSTRAINTS).toBeDefined();
      expect(CREATIVE_CONSTRAINTS.captionMinLength).toBe(100);
      expect(CREATIVE_CONSTRAINTS.captionMaxLength).toBe(300);
      expect(CREATIVE_CONSTRAINTS.hashtagsMin).toBe(5);
      expect(CREATIVE_CONSTRAINTS.hashtagsMax).toBe(10);
    });
  });

  describe('validateCaption — boundary tests', () => {
    it('should validate caption at exactly 100 chars (minimum boundary)', () => {
      const caption = 'A'.repeat(100);
      const result = validateCaption(caption);
      expect(result.valid).toBe(true);
      expect(result.length).toBe(100);
    });

    it('should validate caption at exactly 300 chars (maximum boundary)', () => {
      const caption = 'B'.repeat(300);
      const result = validateCaption(caption);
      expect(result.valid).toBe(true);
      expect(result.length).toBe(300);
    });

    it('should reject caption under 100 chars', () => {
      const caption = 'Too short caption';
      const result = validateCaption(caption);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.length).toBe(caption.length);
    });

    it('should reject caption over 300 chars', () => {
      const caption = 'C'.repeat(301);
      const result = validateCaption(caption);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.length).toBe(301);
    });
  });

  describe('validateHashtags — count boundaries', () => {
    it('should validate 5 hashtags (minimum boundary)', () => {
      const hashtags = ['#summer', '#sale', '#deals', '#fashion', '#style'];
      const result = validateHashtags(hashtags);
      expect(result.valid).toBe(true);
      expect(result.count).toBe(5);
    });

    it('should validate 10 hashtags (maximum boundary)', () => {
      const hashtags = [
        '#one', '#two', '#three', '#four', '#five',
        '#six', '#seven', '#eight', '#nine', '#ten',
      ];
      const result = validateHashtags(hashtags);
      expect(result.valid).toBe(true);
      expect(result.count).toBe(10);
    });

    it('should reject fewer than 5 hashtags', () => {
      const hashtags = ['#summer', '#sale', '#deals'];
      const result = validateHashtags(hashtags);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.count).toBe(3);
    });

    it('should reject more than 10 hashtags', () => {
      const hashtags = [
        '#one', '#two', '#three', '#four', '#five',
        '#six', '#seven', '#eight', '#nine', '#ten', '#eleven',
      ];
      const result = validateHashtags(hashtags);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.count).toBe(11);
    });
  });

  describe('validateHashtags — format rules', () => {
    it('should reject hashtags without # prefix', () => {
      const hashtags = ['#valid', 'invalid', '#also-valid', '#fine', '#ok'];
      const result = validateHashtags(hashtags);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should remove duplicate hashtags', () => {
      const hashtags = [
        '#summer', '#summer', '#sale', '#deals', '#fashion',
        '#style', '#trending',
      ];
      const result = validateHashtags(hashtags);
      // After dedup: 6 unique hashtags
      expect(result.count).toBe(6);
    });

    it('should reject hashtags with spaces', () => {
      const hashtags = ['#summer sale', '#deals', '#fashion', '#style', '#trending'];
      const result = validateHashtags(hashtags);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
