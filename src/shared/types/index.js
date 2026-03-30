// Shared types for AI Marketing Campaign Assistant
// Source of truth for API ↔ Web contract types
export const PLAN_DEFAULTS = {
    platform: 'Instagram',
    targetAudience: 'General audience',
    tone: 'Professional',
};
export const BRIEF_MIN_LENGTH = 10;
export const BRIEF_MAX_LENGTH = 2000;
export const CAMPAIGN_STAGES = [
    'planning',
    'generating',
    'reviewing',
    'awaiting-approval',
    'localizing',
    'complete',
];
export const STAGE_LABELS = {
    'planning': 'Planning',
    'generating': 'Generating',
    'reviewing': 'Reviewing',
    'awaiting-approval': 'Awaiting Approval',
    'localizing': 'Localizing',
    'complete': 'Complete',
};
/** Creative generation constraints */
export const CREATIVE_CONSTRAINTS = {
    captionMinLength: 100,
    captionMaxLength: 300,
    hashtagsMin: 5,
    hashtagsMax: 10,
    maxCaptionRepromptAttempts: 2,
    maxRetryAttempts: 3,
    retryDelays: [2000, 4000],
};
/** Status message configuration for image generation */
export const IMAGE_GEN_STATUS_MESSAGES = {
    start: '🎨 Generating your campaign image…',
    progress15s: '⏳ Still working on your image — this can take up to a minute…',
    progress40s: '🔄 Almost there — putting the finishing touches on your image…',
    complete: '✅ Image generated!',
};
//# sourceMappingURL=index.js.map