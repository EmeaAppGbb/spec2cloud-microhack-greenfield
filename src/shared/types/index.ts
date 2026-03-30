// Shared types for AI Marketing Campaign Assistant
// Source of truth for API ↔ Web contract types

// ---------------------------------------------------------------------------
// Campaign Plan — core output of the Campaign Planner agent
// ---------------------------------------------------------------------------

export interface CampaignPlan {
  campaignName: string;
  objective: string;
  targetAudience: string;
  keyMessages: string[];
  visualDirection: string;
  tone: string;
  platform: string;
}

export const PLAN_DEFAULTS = {
  platform: 'Instagram',
  targetAudience: 'General audience',
  tone: 'Professional',
} as const;

export const BRIEF_MIN_LENGTH = 10;
export const BRIEF_MAX_LENGTH = 2000;

// ---------------------------------------------------------------------------
// Workflow status — tracks pipeline position
// ---------------------------------------------------------------------------

export type WorkflowStatus =
  | 'idle'
  | 'planning'
  | 'plan-complete'
  | 'generating'
  | 'creative-complete'
  | 'reviewing'
  | 'review-complete'
  | 'awaiting-approval'
  | 'approved'
  | 'localizing'
  | 'localization-complete'
  | 'complete';

// ---------------------------------------------------------------------------
// Campaign stages for timeline (6 stages)
// ---------------------------------------------------------------------------

export type CampaignStage =
  | 'planning'
  | 'generating'
  | 'reviewing'
  | 'awaiting-approval'
  | 'localizing'
  | 'complete';

export type StageStatus = 'pending' | 'active' | 'completed';

export const CAMPAIGN_STAGES: CampaignStage[] = [
  'planning',
  'generating',
  'reviewing',
  'awaiting-approval',
  'localizing',
  'complete',
];

export const STAGE_LABELS: Record<CampaignStage, string> = {
  'planning': 'Planning',
  'generating': 'Generating',
  'reviewing': 'Reviewing',
  'awaiting-approval': 'Awaiting Approval',
  'localizing': 'Localizing',
  'complete': 'Complete',
};

// ---------------------------------------------------------------------------
// Chat messages
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system' | 'status';

export type ChatMessageType =
  | 'text'
  | 'plan'
  | 'creative-preview'
  | 'review-report'
  | 'approval-gate'
  | 'market-selection'
  | 'localization-result'
  | 'summary'
  | 'error'
  | 'status';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: {
    agentName?: string;
    streamingComplete?: boolean;
    structuredData?: unknown;
    messageType?: ChatMessageType;
  };
}

// ---------------------------------------------------------------------------
// Campaign record (full persistence model)
// ---------------------------------------------------------------------------

export interface CampaignRecord {
  id: string;
  workflowStatus: WorkflowStatus;
  brief: string;
  plan?: CampaignPlan;
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API request/response shapes for inc-01
// ---------------------------------------------------------------------------

export interface CreateCampaignRequest {
  brief: string;
}

export interface CreateCampaignResponse {
  campaignId: string;
  truncated: boolean;
}

export interface BriefValidationError {
  error: string;
  minLength: number;
  actualLength: number;
}

export interface GetPlanResponse {
  plan: CampaignPlan;
  defaultsApplied: {
    platform: boolean;
    targetAudience: boolean;
    tone: boolean;
  };
}

// ---------------------------------------------------------------------------
// SSE event types
// ---------------------------------------------------------------------------

export type SSEEventType =
  | 'token'
  | 'structured'
  | 'status'
  | 'error'
  | 'complete'
  | 'stage-transition';

export interface SSETokenEvent {
  token: string;
  agentId: string;
}

export interface SSEStructuredEvent {
  type: string;
  data: unknown;
}

export interface SSEStatusEvent {
  message: string;
  agentId: string;
}

export interface SSEErrorEvent {
  message: string;
  agentId: string;
  retryable: boolean;
}

export interface SSECompleteEvent {
  agentId: string;
  nextAgent?: string;
}

export interface SSEStageTransitionEvent {
  stage: CampaignStage;
  status: StageStatus;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Planner agent types
// ---------------------------------------------------------------------------

export interface PlannerInput {
  brief: string;
  originalBriefLength: number;
}

export interface PlannerOutput {
  plan: CampaignPlan;
  wasDefaultApplied: {
    platform: boolean;
    targetAudience: boolean;
    tone: boolean;
  };
}

// ---------------------------------------------------------------------------
// Observability types for structured logging
// ---------------------------------------------------------------------------

export interface AgentLogEntry {
  agentName: 'planner' | 'creative-generator' | 'copy-reviewer' | 'localizer';
  action: 'start' | 'complete' | 'error' | 'retry';
  campaignId: string;
  durationMs?: number;
  errorType?: 'timeout' | 'rate-limit' | 'server-error' | 'unknown';
  attempt?: number;
}

// ---------------------------------------------------------------------------
// Rejection scope (used by approval + creative flows)
// ---------------------------------------------------------------------------

export type RejectionScope = 'regenerate-all' | 'keep-image-redo-text';

// ---------------------------------------------------------------------------
// Creative generation (inc-02)
// ---------------------------------------------------------------------------

/** Creative assets produced by Creative Generator */
export interface CreativeAssets {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  iterationVersion: number;
}

/** Single creative iteration record */
export interface CreativeIteration {
  version: number;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  feedback?: string;
  scope?: RejectionScope;
  generatedAt: string;
}

/** Input to Creative Generator */
export interface CreativeGeneratorInput {
  plan: CampaignPlan;
  rejectionFeedback?: string;
  rejectionScope?: RejectionScope;
  previousIterations?: CreativeIteration[];
  currentImageUrl?: string;
}

/** Creative Generator output */
export interface CreativeGeneratorOutput {
  assets: CreativeAssets;
  imageGenerated: boolean;
  generationDurationMs: number;
}

/** Stored image reference */
export interface StoredImage {
  campaignId: string;
  version: number;
  filename: string;
  mimeType: 'image/png' | 'image/jpeg';
  sizeBytes: number;
  url: string;
  createdAt: string;
}

/** Creative generation constraints */
export const CREATIVE_CONSTRAINTS = {
  captionMinLength: 100,
  captionMaxLength: 300,
  hashtagsMin: 5,
  hashtagsMax: 10,
  maxCaptionRepromptAttempts: 2,
  maxRetryAttempts: 3,
  retryDelays: [2000, 4000],
} as const;

/** Status message configuration for image generation */
export const IMAGE_GEN_STATUS_MESSAGES = {
  start: '🎨 Generating your campaign image…',
  progress15s: '⏳ Still working on your image — this can take up to a minute…',
  progress40s: '🔄 Almost there — putting the finishing touches on your image…',
  complete: '✅ Image generated!',
} as const;

/** SSE event for creative-preview structured data */
export interface CreativePreviewEvent {
  type: 'creative-preview';
  data: CreativeAssets;
}
