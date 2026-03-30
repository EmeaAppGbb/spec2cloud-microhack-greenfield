export const CREATIVE_CONSTRAINTS = {
  captionMinLength: 100,
  captionMaxLength: 300,
  hashtagsMin: 5,
  hashtagsMax: 10,
  maxCaptionRepromptAttempts: 2,
  maxRetryAttempts: 3,
  retryDelays: [2000, 4000],
} as const;

interface CaptionValidationResult {
  valid: boolean;
  error?: string;
  length: number;
}

interface HashtagValidationResult {
  valid: boolean;
  error?: string;
  count: number;
}

export function validateCaption(caption: string): CaptionValidationResult {
  const length = caption.length;

  if (length < CREATIVE_CONSTRAINTS.captionMinLength) {
    return {
      valid: false,
      error: `Caption too short: ${length} characters (minimum ${CREATIVE_CONSTRAINTS.captionMinLength})`,
      length,
    };
  }

  if (length > CREATIVE_CONSTRAINTS.captionMaxLength) {
    return {
      valid: false,
      error: `Caption too long: ${length} characters (maximum ${CREATIVE_CONSTRAINTS.captionMaxLength})`,
      length,
    };
  }

  return { valid: true, length };
}

export function validateHashtags(hashtags: string[]): HashtagValidationResult {
  // Deduplicate
  const unique = [...new Set(hashtags)];
  const count = unique.length;

  // Check format: each must start with # and contain no spaces
  for (const tag of unique) {
    if (!tag.startsWith('#')) {
      return {
        valid: false,
        error: `Hashtag "${tag}" must start with #`,
        count,
      };
    }
    if (tag.includes(' ')) {
      return {
        valid: false,
        error: `Hashtag "${tag}" must not contain spaces`,
        count,
      };
    }
  }

  if (count < CREATIVE_CONSTRAINTS.hashtagsMin) {
    return {
      valid: false,
      error: `Too few hashtags: ${count} (minimum ${CREATIVE_CONSTRAINTS.hashtagsMin})`,
      count,
    };
  }

  if (count > CREATIVE_CONSTRAINTS.hashtagsMax) {
    return {
      valid: false,
      error: `Too many hashtags: ${count} (maximum ${CREATIVE_CONSTRAINTS.hashtagsMax})`,
      count,
    };
  }

  return { valid: true, count };
}
