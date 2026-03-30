const BRIEF_MIN_LENGTH = 10;
const BRIEF_MAX_LENGTH = 2000;

interface BriefValidationResult {
  valid: boolean;
  trimmedBrief?: string;
  truncated?: boolean;
  originalLength?: number;
  error?: string;
  minLength?: number;
  actualLength?: number;
}

export function validateBrief(brief: string): BriefValidationResult {
  const trimmed = brief.trim();

  if (trimmed.length < BRIEF_MIN_LENGTH) {
    return {
      valid: false,
      error: 'Brief too short',
      minLength: BRIEF_MIN_LENGTH,
      actualLength: trimmed.length,
    };
  }

  if (trimmed.length > BRIEF_MAX_LENGTH) {
    return {
      valid: true,
      truncated: true,
      trimmedBrief: trimmed.slice(0, BRIEF_MAX_LENGTH),
      originalLength: trimmed.length,
    };
  }

  return {
    valid: true,
    truncated: false,
    trimmedBrief: trimmed,
  };
}
