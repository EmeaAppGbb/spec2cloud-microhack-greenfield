# FRD: Chat Interface & Streaming

**Feature ID**: `chat-interface`
**PRD Reference**: §4.1 Chat Interface & Streaming
**Status**: Draft

## 1. Overview

The Chat Interface & Streaming feature provides the primary user interaction surface for the AI Marketing Campaign Assistant. It is a split-panel layout with a chat panel on the left for conversational interaction with AI agents, and a visual timeline on the right showing campaign progression. The chat supports token-by-token streaming for text-generating agents, status messages during long-running operations (image generation), atomic delivery of structured data, and inline interactive UI controls for approval gates and market selection. It also handles AI failure UX and guards against accidental campaign abandonment.

## 2. User Stories

This FRD covers the following user stories from the PRD:

- **US-1**: As a campaign creator, I want to describe a marketing campaign in plain English so that I don't need to fill out structured forms.
- **US-15**: As a campaign creator, I want to see a visual timeline on the right panel showing campaign stages so that I always know where the workflow is.
- **US-16**: As a campaign creator, I want token-by-token streaming of agent responses in the chat so that I see output progressively rather than waiting for a complete response.
- **US-17**: As a campaign creator, I want status messages during image generation so that I know the system is working during the wait (up to a minute).
- **US-20**: As a campaign creator, I want the system to automatically retry failed AI calls so that transient errors don't disrupt my workflow.
- **US-21**: As a campaign creator, I want to see an error message and retry button when AI calls fail after automatic retries so that I can decide whether to try again.
- **US-22**: As a campaign creator, I want a warning before my current campaign is abandoned so that I don't accidentally lose progress.
- **US-24**: As a campaign creator, I want a completion summary card showing all campaign results so that I can review the final output in one place.

## 3. Functional Requirements

### FR-1: Split-Panel Layout

- **Description**: The application renders a two-panel layout — a chat panel occupying the left portion and a timeline panel occupying the right portion.
- **Input**: Application load / page render.
- **Output**: A responsive split-panel layout with chat on the left and timeline on the right.
- **Behavior**:
  1. On page load, the application renders two adjacent panels.
  2. The left panel contains the chat interface (message history, input area).
  3. The right panel contains the campaign timeline (see `campaign-timeline` feature).
  4. The layout must be responsive — on narrow viewports the panels may stack vertically (chat on top, timeline below).
  5. Both panels are always visible during an active campaign workflow.
- **Error handling**: If the page fails to render, a generic error boundary catches the failure and displays a reload prompt.
- **Acceptance criteria**:
  - Given the application loads, when the page renders, then a left chat panel and right timeline panel are displayed side by side.
  - Given a narrow viewport, when the page renders, then the panels stack vertically with chat on top.

### FR-2: Message Input and Submission

- **Description**: The user can type a campaign brief as a free-text message and submit it to initiate the campaign pipeline.
- **Input**: User types text into a message input field and presses Enter or clicks a Send button.
- **Output**: The message appears in the chat history as a user message, and the campaign pipeline is triggered.
- **Behavior**:
  1. A text input area is displayed at the bottom of the chat panel.
  2. The user types a message in the input area.
  3. The user submits by pressing Enter (without Shift) or clicking a Send button.
  4. Shift+Enter inserts a newline without submitting.
  5. On submission, the message is appended to the chat history as a user message bubble.
  6. The input field is cleared after submission.
  7. The Send button and Enter key are disabled while the input is empty or whitespace-only.
  8. During an active pipeline (agents are processing), the input field is disabled to prevent concurrent submissions — except for the new-brief-during-active-pipeline flow (see FR-9).
- **Error handling**: If the message cannot be sent (e.g., backend unreachable), an error message is displayed inline in the chat.
- **Acceptance criteria**:
  - Given the chat is idle, when the user types a non-empty message and presses Enter, then the message appears in chat history and the pipeline starts.
  - Given the input is empty, when the user presses Enter, then nothing happens (submit is disabled).
  - Given the pipeline is active, when the user attempts to type, then the input is disabled.

### FR-3: Token-by-Token Streaming for Text Agents

- **Description**: Responses from text-generating agents (Campaign Planner, Copy Reviewer, Localizer) stream token-by-token into the chat, providing progressive output.
- **Input**: A text-generating agent begins producing output.
- **Output**: Tokens appear progressively in the chat as a growing message bubble, rendered as formatted markdown.
- **Behavior**:
  1. When a text agent starts producing output, a new assistant message bubble appears in the chat.
  2. Tokens are appended to the message as they arrive from the backend streaming endpoint.
  3. The message content is rendered as formatted markdown (headings, bold, lists, etc.) and re-rendered as new tokens arrive.
  4. The chat automatically scrolls to the bottom as new content appears, unless the user has manually scrolled up.
  5. If the user scrolls up during streaming, auto-scroll pauses. A "scroll to bottom" indicator appears.
  6. Streaming applies to: Campaign Planner explanatory text, Copy Reviewer report text, Localizer translation text.
  7. Image generation does NOT stream — see FR-4 for that behavior.
- **Error handling**: If the streaming connection drops mid-stream, the partial message is preserved and an error indicator is appended to it with a retry option.
- **Acceptance criteria**:
  - Given a text agent is producing output, when tokens arrive, then they appear progressively in the chat (not as a single block).
  - Given the user has not scrolled up, when new tokens arrive, then the chat auto-scrolls to show the latest content.
  - Given the user has scrolled up, when new tokens arrive, then auto-scroll is paused and a "scroll to bottom" indicator appears.

### FR-4: Status Messages During Image Generation

- **Description**: During image generation (which can take up to a minute), the chat displays status/progress messages instead of streaming tokens.
- **Input**: The Creative Generator agent begins image generation.
- **Output**: One or more status messages appear in the chat indicating progress.
- **Behavior**:
  1. When image generation begins, a status message appears in the chat (e.g., "Generating your campaign image…").
  2. An animated loading indicator (spinner or progress bar) accompanies the status message.
  3. Additional status updates may appear as generation progresses (e.g., "Still working on your image…" after 15 seconds).
  4. When the image is ready, the status message is replaced or followed by the rendered image in the chat.
  5. The image is displayed inline in the chat at a reasonable preview size with the option to view full-size.
  6. After creative generation completes, a `creative-preview` message is rendered in the chat showing the generated image, caption text, and hashtags. The image is displayed inline at a reasonable size. Caption and hashtags are shown as formatted text below the image.
- **Error handling**: If image generation fails (after retries — see FR-8), the status message is replaced with an error message and a retry button.
- **Acceptance criteria**:
  - Given image generation starts, when the process begins, then a status message with a loading indicator appears in the chat.
  - Given image generation completes, when the image is ready, then the image is displayed inline in the chat.
  - Given image generation takes more than 15 seconds, when the wait continues, then additional status messages appear.

### FR-5: Structured Data Atomic Delivery

- **Description**: Structured data outputs (campaign plan schema, copy review verdict, localization results) are delivered atomically after any streaming explanation text.
- **Input**: An agent produces a structured data payload alongside explanatory text.
- **Output**: The explanatory text streams token-by-token, and the structured data block appears all at once after the text completes.
- **Behavior**:
  1. When an agent produces both explanatory text and structured data, the text streams first per FR-3.
  2. After the streaming text completes, the structured data is rendered as a formatted block (card, table, or structured markdown section) in a single atomic operation.
  3. The structured data block includes all fields — it never appears partially.
  4. Structured data types include:
     - Campaign plan (7 fields: campaignName, objective, targetAudience, keyMessages, visualDirection, tone, platform).
     - Copy review verdict and findings.
     - Localization results (per-market translations).
- **Error handling**: If the structured data payload is malformed or incomplete, an error message is shown in place of the block with a retry option.
- **Acceptance criteria**:
  - Given a text agent produces explanatory text and structured data, when the response completes, then the text streams token-by-token and the structured data appears atomically after the text.
  - Given the structured data is a campaign plan, when it renders, then all 7 fields are visible in a single block.

### FR-6: Inline Approval Gate UI

- **Description**: When the workflow reaches the human approval gate, the chat renders inline UI controls for the user to approve or reject creative assets.
- **Input**: The workflow reaches the approval gate stage.
- **Output**: An inline approval card in the chat displaying the image, caption, hashtags, review report, and action buttons.
- **Behavior**:
  1. The approval card renders inline within the chat flow (not as a modal or separate page).
  2. The card displays: the AI-generated image (preview), caption text, hashtag list, and the copy reviewer's report (verdict + findings).
  3. If the copy review verdict is "flag," a warning banner is shown at the top of the card highlighting the flagged issues.
  4. An "Approve" button is always enabled.
  5. A text input field for rejection feedback is displayed.
  6. Two rejection buttons are displayed: "Regenerate All" and "Keep Image, Redo Text."
  7. Both rejection buttons are disabled until the feedback input contains non-empty text.
  8. Clicking "Approve" advances the workflow to the Localizer (market selection).
  9. Clicking either rejection button sends the feedback and the selected scope back to the Creative Generator. The card becomes read-only (buttons disabled) after action.
  10. Each creative iteration is numbered (e.g., "Creative v1", "Creative v2") and previous iterations remain visible in scroll history.
  11. The user can approve despite flags (informed override) — no blocking confirmation.
- **Error handling**: If the approval action fails to send to the backend, an error message is displayed inline with a retry option.
- **Acceptance criteria**:
  - Given the workflow reaches the approval gate, when the card renders, then the image, caption, hashtags, and review report are all visible.
  - Given the review verdict is "flag," when the card renders, then a warning banner is displayed highlighting the flagged issues.
  - Given the feedback input is empty, when the user views the rejection buttons, then both are disabled.
  - Given the feedback input contains text, when the user clicks "Regenerate All," then the Creative Generator is re-invoked with feedback and scope "regenerate-all."
  - Given the feedback input contains text, when the user clicks "Keep Image, Redo Text," then the Creative Generator is re-invoked with feedback and scope "keep-image-redo-text."
  - Given the user clicks "Approve," then the workflow advances to market selection.
  - Given a rejection-regeneration cycle completes, when the new approval card renders, then it is numbered sequentially (e.g., "Creative v2") and the previous iteration remains visible.

### FR-7: Inline Market Selection UI

- **Description**: After creative approval, the chat renders an inline market selection prompt for the user to choose localization targets.
- **Input**: The user approves creative assets at the approval gate.
- **Output**: An inline market selection card in the chat with checkboxes for each market and action buttons.
- **Behavior**:
  1. After the user approves creative assets, a market selection card renders inline in the chat.
  2. The card displays checkboxes for: Spain 🇪🇸, France 🇫🇷, Germany 🇩🇪, Brazil 🇧🇷, Japan 🇯🇵.
  3. An "All Markets" option selects all five checkboxes.
  4. A "Skip Localization" button is available to skip localization entirely.
  5. A "Localize" button submits the selected markets.
  6. The "Localize" button is disabled if no markets are selected (but "Skip Localization" is always enabled).
  7. After action (Localize or Skip), the card becomes read-only showing the selection made.
- **Error handling**: If the selection cannot be submitted, an error message is shown with a retry option.
- **Acceptance criteria**:
  - Given the user approves creative, when the market selection card renders, then checkboxes for all five markets are displayed.
  - Given the user selects "All Markets," then all five checkboxes are checked.
  - Given the user clicks "Skip Localization," then the workflow advances to completion without localization.
  - Given the user selects one or more markets and clicks "Localize," then the Localizer agent is invoked with the selected markets.

### FR-8: AI Failure Retry UX

- **Description**: When an AI service call fails, the system automatically retries up to 3 times. If all retries fail, an error message with a manual retry button is displayed.
- **Input**: An AI service call (LLM or image generation) fails.
- **Output**: Automatic retry (invisible to user) or, after 3 failures, an inline error message with a retry button.
- **Behavior**:
  1. When an AI call fails, the system retries automatically up to 3 times with exponential backoff.
  2. During automatic retries, the user sees the normal loading/streaming state — retries are transparent.
  3. If all 3 automatic retries fail, an error message is displayed inline in the chat (e.g., "The AI service is temporarily unavailable. Please try again.").
  4. A "Retry" button is displayed alongside the error message.
  5. Clicking "Retry" re-invokes the failed agent step from the beginning (not a partial resume).
  6. The retry button can be clicked multiple times — each click triggers a new set of up to 3 automatic retries.
  7. This applies to all agent steps: planning, creative generation, copy review, and localization.
- **Error handling**: The error message clearly states which step failed and that the user can retry.
- **Acceptance criteria**:
  - Given an AI call fails transiently, when the system retries automatically, then the user does not see the failure (retries are invisible).
  - Given all 3 automatic retries fail, when the error is surfaced, then an error message and a "Retry" button are displayed in the chat.
  - Given the user clicks "Retry," when the retry triggers, then the failed agent step is re-invoked from the beginning.
  - Given the retry succeeds, when the response arrives, then the workflow continues normally.

### FR-9: New Brief During Active Pipeline Warning

- **Description**: If the user attempts to submit a new brief while a campaign pipeline is already active, a warning is shown to confirm abandonment of the current campaign.
- **Input**: User attempts to submit a new message while the pipeline is active.
- **Output**: A confirmation dialog/prompt warning that the current campaign will be abandoned.
- **Behavior**:
  1. When the pipeline is active (any agent is processing or the approval gate is pending), the input field is normally disabled (FR-2).
  2. However, a "New Campaign" or "Start Over" button is available in the UI to initiate a new brief.
  3. Clicking this button enables the input field and, on submission, displays a confirmation prompt: "Starting a new campaign will abandon your current progress. Continue?"
  4. If the user confirms, the current campaign is abandoned, the chat is cleared, and the new brief triggers a fresh pipeline.
  5. If the user cancels, the current campaign continues uninterrupted and the input field is re-disabled.
  6. The abandoned campaign data is NOT deleted from persistence (it remains recoverable), but the UI resets.
- **Error handling**: If the cancellation/new campaign API call fails, an error message is displayed and the current campaign is preserved.
- **Acceptance criteria**:
  - Given a pipeline is active, when the user clicks "Start Over" and submits a new brief, then a confirmation warning is displayed.
  - Given the user confirms the warning, then the current campaign is abandoned and the new brief starts a fresh pipeline.
  - Given the user cancels the warning, then the current campaign continues uninterrupted.

### FR-10: Completion Summary Card

- **Description**: After the campaign workflow finishes (localization complete or localization skipped), a summary card is displayed showing all campaign results.
- **Input**: The campaign workflow reaches the "Complete" stage.
- **Output**: An inline summary card in the chat showing the full campaign output.
- **Behavior**:
  1. When the campaign completes, a summary card is rendered inline in the chat.
  2. The summary card displays:
     - Campaign name and objective (from the plan).
     - The approved AI-generated image.
     - The approved caption and hashtags.
     - The copy review verdict and key findings.
     - Localization results (if any) — per-market caption and hashtags alongside the original English.
  3. A "New Campaign" button is displayed on the card.
  4. Clicking "New Campaign" clears the chat and resets the UI for a fresh campaign brief.
- **Error handling**: If the summary card data is incomplete (e.g., missing localization results), the card renders with available data and notes what is missing.
- **Acceptance criteria**:
  - Given the campaign workflow completes, when the summary card renders, then the image, caption, hashtags, review verdict, and localization results are all displayed.
  - Given the user clicks "New Campaign," then the chat is cleared and the UI resets to accept a new brief.

## 4. Data Model

```typescript
/** Types of messages that can appear in the chat */
type MessageRole = 'user' | 'assistant' | 'system' | 'status';

/** Base structure for all chat messages */
interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;                // Markdown content or plain text
  timestamp: string;              // ISO 8601
  metadata?: MessageMetadata;
}

/** Optional metadata attached to assistant messages */
interface MessageMetadata {
  agentId?: string;               // Which agent produced this message
  streamingComplete?: boolean;    // Whether token streaming has finished
  structuredData?: unknown;       // Atomic structured payload (plan, review, etc.)
  messageType?: ChatMessageType;
}

/** Discriminated types for special chat messages */
type ChatMessageType =
  | 'text'                        // Normal streaming text
  | 'plan'                        // Structured campaign plan
  | 'creative-preview'            // Image + caption + hashtags display
  | 'review-report'               // Copy review report
  | 'approval-gate'               // Approval card
  | 'market-selection'            // Market selection card
  | 'localization-result'         // Per-market translation results
  | 'summary'                     // Completion summary card
  | 'error'                       // Error with retry button
  | 'status';                     // Status/progress indicator

/** Approval gate action payload */
interface ApprovalAction {
  action: 'approve' | 'reject';
  feedback?: string;              // Required when action is 'reject'
  rejectionScope?: 'regenerate-all' | 'keep-image-redo-text';
}

/** Market selection payload */
interface MarketSelectionAction {
  action: 'localize' | 'skip';
  selectedMarkets?: SupportedMarket[];
}

type SupportedMarket = 'spain' | 'france' | 'germany' | 'brazil' | 'japan';

/** Creative iteration for numbering */
interface CreativeIteration {
  iterationNumber: number;        // 1, 2, 3, ...
  imageUrl: string;
  caption: string;
  hashtags: string[];
  reviewReport: CopyReviewReport;
}

/** Copy review report (referenced from copy-review feature) */
interface CopyReviewReport {
  verdict: 'pass' | 'flag';
  findings: CopyReviewFinding[];
}

interface CopyReviewFinding {
  type: 'brand-alignment' | 'legal' | 'tone';
  severity: 'info' | 'warning' | 'critical';
  detail: string;
}
```

## 5. API Contracts

### Streaming Endpoint

- **Method**: `GET`
- **Path**: `/api/campaign/{campaignId}/stream`
- **Description**: Server-Sent Events (SSE) endpoint for streaming agent output to the frontend.
- **Response**: SSE stream with the following event types:
  - `token` — a single token of text `{ token: string, agentId: string }`
  - `structured` — atomic structured data `{ type: string, data: object }`
  - `status` — status/progress message `{ message: string, agentId: string }`
  - `error` — error event `{ message: string, agentId: string, retryable: boolean }`
  - `complete` — agent step complete `{ agentId: string, nextAgent?: string }`
  - `stage-transition` — campaign stage change `{ stage: CampaignStage, status: StageStatus, timestamp: string }`

### Submit Brief

- **Method**: `POST`
- **Path**: `/api/campaign`
- **Request body**: `{ brief: string }`
- **Response**: `{ campaignId: string }`

### Submit Approval Action

- **Method**: `POST`
- **Path**: `/api/campaign/{campaignId}/approve`
- **Request body**: `ApprovalAction`
- **Response**: `{ status: 'accepted' }`
- **Behavior**: The API handler resumes the paused LangGraph workflow by calling the graph's interrupt resume mechanism with the approval/rejection payload. The LangGraph graph is paused at the human-approval interrupt node and waits for this signal.

### Submit Market Selection

- **Method**: `POST`
- **Path**: `/api/campaign/{campaignId}/localize`
- **Request body**: `MarketSelectionAction`
- **Response**: `{ status: 'accepted' }`

### Retry Failed Step

- **Method**: `POST`
- **Path**: `/api/campaign/{campaignId}/retry`
- **Request body**: `{ agentId: string }`
- **Response**: `{ status: 'retrying' }`

## 6. UI/UX Requirements

- **Layout**: Split-panel with 60% width for chat and 40% for timeline (desktop). On mobile/narrow viewports, stack vertically.
- **Chat panel**: Scrollable message list with user messages right-aligned, assistant messages left-aligned. Input area fixed at the bottom.
- **Message bubbles**: User messages styled distinctly from assistant messages. Status messages styled as system notifications (centered, muted color).
- **Streaming**: Text appears character by character with a subtle cursor/caret animation at the insertion point.
- **Approval card**: Prominent card with image preview (max 400px width), formatted caption, hashtag chips, review report section, feedback input, and action buttons. Warning banner in amber/yellow for "flag" verdicts.
- **Market selection card**: Checkbox list with country flags and names. "All Markets" toggle. "Localize" primary button, "Skip Localization" secondary button.
- **Error messages**: Red-tinted inline message with an icon and a "Retry" button.
- **Summary card**: Full-width card with sections for each campaign output. "New Campaign" primary button.
- **Auto-scroll**: Chat scrolls to bottom on new content unless user has scrolled up. "↓ New messages" indicator when scrolled up.

## 7. Dependencies

- **`campaign-planning`**: Plan output streams into the chat and renders as structured data.
- **`creative-generation`**: Image and creative assets display inline; status messages during generation.
- **`copy-review`**: Review report renders inline; verdict affects approval gate UI.
- **`human-approval`**: Approval gate UI controls rendered by this feature.
- **`localization`**: Market selection UI and localization results rendered by this feature.
- **`campaign-timeline`**: Timeline panel is rendered alongside the chat panel.
- **`data-persistence`**: Chat messages and campaign state must be persisted; page refresh restores chat history.

## 8. Acceptance Criteria Summary

1. The layout renders a left chat panel and a right timeline panel.
2. The user can type and submit a campaign brief in the chat input.
3. All text-generating agent responses (Planner, Copy Reviewer, Localizer) stream token-by-token into the chat.
4. Image generation shows status/progress messages with a loading indicator, not streaming.
5. Structured data (plan, review verdict, localization results) is delivered atomically after streaming explanation text.
6. The approval gate UI renders inline in the chat with image preview, caption, hashtags, review report, approve button, feedback input, and two rejection scope buttons.
7. A warning banner is displayed on the approval card when the copy review verdict is "flag."
8. Rejection buttons are disabled until the feedback input contains non-empty text.
9. Market selection UI renders inline in the chat with checkboxes for five markets, "All Markets" option, "Localize," and "Skip Localization."
10. AI service failures trigger automatic retry (up to 3 attempts), then display an error message with a manual "Retry" button.
11. A warning and confirmation prompt appear when the user initiates a new campaign during an active pipeline.
12. A completion summary card showing all campaign results is displayed after the workflow finishes.
13. The "New Campaign" button clears the chat for a fresh start.
14. Creative iterations are numbered sequentially and previous iterations remain visible in chat scroll history.
