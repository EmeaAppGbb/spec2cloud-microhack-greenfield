import { describe, it, expect } from 'vitest';
import { validateBrief } from '../../src/services/brief-validation.js';

const BRIEF_MIN_LENGTH = 10;
const BRIEF_MAX_LENGTH = 2000;

describe('Brief Validation Service', () => {
  describe('whitespace trimming', () => {
    it('should trim leading and trailing whitespace before validation', () => {
      const result = validateBrief('   Hello World Campaign   ');
      expect(result.valid).toBe(true);
      expect(result.trimmedBrief).toBe('Hello World Campaign');
    });
  });

  describe('rejection — empty and short briefs', () => {
    it('should reject an empty string', () => {
      const result = validateBrief('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Brief too short');
      expect(result.minLength).toBe(BRIEF_MIN_LENGTH);
      expect(result.actualLength).toBe(0);
    });

    it('should reject a brief shorter than 10 characters', () => {
      const result = validateBrief('Too short');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Brief too short');
      expect(result.actualLength).toBe(9);
    });

    it('should reject whitespace-only input (0 chars after trim)', () => {
      const result = validateBrief('        ');
      expect(result.valid).toBe(false);
      expect(result.actualLength).toBe(0);
    });

    it('should reject input that is short after trimming', () => {
      const result = validateBrief('   Hi   ');
      expect(result.valid).toBe(false);
      expect(result.actualLength).toBe(2);
    });
  });

  describe('acceptance — valid briefs', () => {
    it('should accept a brief with exactly 10 characters (boundary)', () => {
      const result = validateBrief('A'.repeat(10));
      expect(result.valid).toBe(true);
      expect(result.truncated).toBe(false);
      expect(result.trimmedBrief).toBe('A'.repeat(10));
    });

    it('should accept a brief with more than 10 characters', () => {
      const brief = 'Launch a comprehensive summer marketing campaign';
      const result = validateBrief(brief);
      expect(result.valid).toBe(true);
      expect(result.truncated).toBe(false);
      expect(result.trimmedBrief).toBe(brief);
    });
  });

  describe('truncation — long briefs', () => {
    it('should truncate a brief longer than 2000 characters', () => {
      const longBrief = 'A'.repeat(2500);
      const result = validateBrief(longBrief);
      expect(result.valid).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.trimmedBrief).toBe('A'.repeat(BRIEF_MAX_LENGTH));
      expect(result.trimmedBrief!.length).toBe(BRIEF_MAX_LENGTH);
    });

    it('should accept a brief with exactly 2000 characters without truncation', () => {
      const exactBrief = 'B'.repeat(2000);
      const result = validateBrief(exactBrief);
      expect(result.valid).toBe(true);
      expect(result.truncated).toBe(false);
      expect(result.trimmedBrief).toBe(exactBrief);
    });

    it('should return the original length when truncation occurs', () => {
      const longBrief = 'C'.repeat(3000);
      const result = validateBrief(longBrief);
      expect(result.valid).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.originalLength).toBe(3000);
    });
  });
});
