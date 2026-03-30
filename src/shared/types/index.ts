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
