export interface CampaignPlan {
    campaignName: string;
    objective: string;
    targetAudience: string;
    keyMessages: string[];
    visualDirection: string;
    tone: string;
    platform: string;
}
export declare const PLAN_DEFAULTS: {
    readonly platform: "Instagram";
    readonly targetAudience: "General audience";
    readonly tone: "Professional";
};
export declare const BRIEF_MIN_LENGTH = 10;
export declare const BRIEF_MAX_LENGTH = 2000;
export type WorkflowStatus = 'idle' | 'planning' | 'plan-complete' | 'generating' | 'creative-complete' | 'reviewing' | 'review-complete' | 'awaiting-approval' | 'approved' | 'localizing' | 'localization-complete' | 'complete';
export type CampaignStage = 'planning' | 'generating' | 'reviewing' | 'awaiting-approval' | 'localizing' | 'complete';
export type StageStatus = 'pending' | 'active' | 'completed';
export declare const CAMPAIGN_STAGES: CampaignStage[];
export declare const STAGE_LABELS: Record<CampaignStage, string>;
export type MessageRole = 'user' | 'assistant' | 'system' | 'status';
export type ChatMessageType = 'text' | 'plan' | 'creative-preview' | 'review-report' | 'approval-gate' | 'market-selection' | 'localization-result' | 'summary' | 'error' | 'status';
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
export interface CampaignRecord {
    id: string;
    workflowStatus: WorkflowStatus;
    brief: string;
    plan?: CampaignPlan;
    chatHistory: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}
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
export type SSEEventType = 'token' | 'structured' | 'status' | 'error' | 'complete' | 'stage-transition';
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
export interface AgentLogEntry {
    agentName: 'planner' | 'creative-generator' | 'copy-reviewer' | 'localizer';
    action: 'start' | 'complete' | 'error' | 'retry';
    campaignId: string;
    durationMs?: number;
    errorType?: 'timeout' | 'rate-limit' | 'server-error' | 'unknown';
    attempt?: number;
}
export type RejectionScope = 'regenerate-all' | 'keep-image-redo-text';
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
export declare const CREATIVE_CONSTRAINTS: {
    readonly captionMinLength: 100;
    readonly captionMaxLength: 300;
    readonly hashtagsMin: 5;
    readonly hashtagsMax: 10;
    readonly maxCaptionRepromptAttempts: 2;
    readonly maxRetryAttempts: 3;
    readonly retryDelays: readonly [2000, 4000];
};
/** Status message configuration for image generation */
export declare const IMAGE_GEN_STATUS_MESSAGES: {
    readonly start: "🎨 Generating your campaign image…";
    readonly progress15s: "⏳ Still working on your image — this can take up to a minute…";
    readonly progress40s: "🔄 Almost there — putting the finishing touches on your image…";
    readonly complete: "✅ Image generated!";
};
/** SSE event for creative-preview structured data */
export interface CreativePreviewEvent {
    type: 'creative-preview';
    data: CreativeAssets;
}
//# sourceMappingURL=index.d.ts.map