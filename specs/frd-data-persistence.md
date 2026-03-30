# FRD: Data Persistence

**Feature ID**: `data-persistence`
**PRD Reference**: §4.8 Data Persistence
**Status**: Draft

## 1. Overview

Data Persistence ensures that all campaign data — including the brief, structured plan, creative assets, review reports, approval decisions, translations, workflow state, and chat history — is reliably persisted at each stage of the campaign workflow. This enables page refresh resumption (the user picks up exactly where they left off), image serving via URL, completion summary display, and clean "New Campaign" transitions. The system explicitly refuses to operate with silent in-memory fallback if the database is unreachable.

## 2. User Stories

This FRD covers the following PRD user stories:

- **US-18**: As a campaign creator, I want all campaign data persisted at each stage so that nothing is lost if I refresh the page.
- **US-19**: As a campaign creator, I want to resume my campaign from the last completed stage after a page refresh so that I don't lose progress.
- **US-22**: As a campaign creator, I want a warning before my current campaign is abandoned so that I don't accidentally lose progress.
- **US-24**: As a campaign creator, I want a completion summary card showing all campaign results so that I can review the final output in one place.

Related (partial coverage):
- **US-17**: Status messages during image generation — image URLs must be persisted and servable.
- **US-5**: Creative Generator produces an AI-generated image — images must be saved and servable via URL.

## 3. Functional Requirements

### FR-1: Persist Campaign Data at Each Stage Transition

- **Description**: Campaign data is written to persistent storage each time the workflow transitions between stages. This creates a durable checkpoint at every step of the pipeline.
- **Input**: A stage transition event (e.g., Planner completes, Creative Generator completes, review completes, approval decision, localization completes).
- **Output**: Campaign record updated in the database with the latest data.
- **Behavior**:
  1. After the **Planning** stage completes: persist the campaign brief (user input), the structured plan (all schema fields), and set workflow status to `plan-complete`.
  2. After the **Creative Generation** stage completes: persist the generated image reference (storage path + serving URL), caption, hashtags, and the creative iteration number. Set workflow status to `creative-complete`.
  3. After the **Copy Review** stage completes: persist the full review report (verdict, findings array). Set workflow status to `review-complete`.
  4. After **Approval**: persist the approval decision (`approved` or `rejected`), feedback text (if rejected), and rejection scope (`regenerate-all` or `keep-image-redo-text`). If approved, set workflow status to `approved`. If rejected, set workflow status to `generating` (loop back).
  5. After **Localization** completes: persist all translations (per-market caption and hashtags), and set workflow status to `localization-complete`.
  6. After the workflow reaches **Complete**: set workflow status to `complete`.
  7. Each persist operation is atomic — either the full stage data is written or none of it is (no partial writes).
  8. If a rejection occurs, the creative iteration counter is incremented and the new creative output is persisted alongside (not replacing) previous iterations.
- **Error handling**: If the persist operation fails, the workflow does **not** advance. An error message is displayed to the user: "Failed to save campaign data. Please try again." A retry button is presented.
- **Acceptance criteria**:
  - Given the Planner completes, when the data is persisted, then the campaign record contains the brief and structured plan.
  - Given the Creative Generator completes, when the data is persisted, then the campaign record contains the image URL, caption, and hashtags.
  - Given a rejection occurs, when the data is persisted, then the rejection feedback and scope are stored, and the previous creative iteration is retained.
  - Given a persist operation fails, when the error is caught, then an error message with retry is shown and the workflow does not advance.

### FR-2: Image Storage and URL Serving

- **Description**: AI-generated images are saved to persistent storage and served to the frontend via a stable URL.
- **Input**: Binary image data from the AI image generation service.
- **Output**: A stored image file accessible via a URL.
- **Behavior**:
  1. When the Creative Generator produces an image, the binary image data is saved to persistent storage (file system or blob storage).
  2. Each image is stored with a unique identifier (e.g., `{campaignId}/{iterationNumber}.png`).
  3. A serving URL is generated for the image (e.g., `/api/campaigns/{campaignId}/images/{iterationNumber}`).
  4. The URL is stored in the campaign record and used by the frontend to display the image.
  5. Images from previous creative iterations are **retained** (not deleted) — they remain accessible for chat history display.
  6. On "New Campaign", images from the previous campaign are **not** immediately deleted (see FR-7 for data lifecycle).
  7. Supported image format: PNG. The API serves images with `Content-Type: image/png`.
- **Error handling**: If image storage fails, the Creative Generator stage fails and the user sees an error with retry option. The workflow does not advance.
- **Acceptance criteria**:
  - Given an image is generated, when it is saved, then it is retrievable via the serving URL.
  - Given a campaign has multiple creative iterations, when the user views chat history, then all iteration images are accessible via their respective URLs.
  - Given an image URL is requested, when the server responds, then the response has `Content-Type: image/png` and contains valid image data.

### FR-3: Page Refresh Resumption

- **Description**: When the user refreshes the page, the campaign is restored to the last completed stage. The user sees all data generated so far and can continue from the current workflow position.
- **Input**: Page load event (browser refresh or navigation).
- **Output**: The UI renders the campaign at its last persisted state.
- **Behavior**:
  1. On page load, the frontend requests the current campaign state from the backend.
  2. If a campaign exists, the backend returns the full campaign data including: brief, plan (if completed), creative assets (if generated), review report (if completed), approval status, translations (if completed), workflow status, and chat history.
  3. The frontend restores the chat panel with the full chat history (all messages up to the last completed stage).
  4. The timeline is restored to reflect the current workflow stage (see `campaign-timeline` FRD).
  5. If the campaign was in the middle of an agent execution (e.g., the Planner was running when the user refreshed), the campaign resumes from the **last completed stage**, not from the mid-execution point. The in-progress agent work is lost, and the user must re-trigger it (e.g., the agent re-runs from the last checkpoint).
  6. When the campaign was interrupted mid-agent (e.g., during image generation), the restored UI shows the last completed stage results plus a "Resume Campaign" button. Clicking the button re-invokes the interrupted agent from the beginning of its step. The user is not auto-resumed — they must explicitly click Resume.
  7. If the campaign was at the **Awaiting Approval** stage, the approval UI is re-rendered with the creative assets and review report.
  8. If the campaign was already **Complete**, the completion summary card is displayed.
- **Error handling**: If the campaign data is corrupted or unreadable, display an error message and offer a "Start New Campaign" option.
- **Acceptance criteria**:
  - Given a campaign is at the "review-complete" stage, when the user refreshes the page, then the chat shows the brief, plan, creative assets, and review report, and the workflow can continue from the approval gate.
  - Given a campaign is mid-execution (e.g., Planner is running), when the user refreshes, then the campaign restores to the last completed stage (not mid-execution).
  - Given a campaign is complete, when the user refreshes, then the completion summary card is displayed.

### FR-4: Chat History Restoration

- **Description**: On page refresh, the full chat history is restored so the user sees the complete conversation up to the current point.
- **Input**: Page load event with an existing campaign.
- **Output**: The chat panel displays all previous messages in order.
- **Behavior**:
  1. Chat messages are persisted as part of the campaign data. Each message includes: role (`user` | `assistant` | `system`), content (text or structured data), timestamp, and optional metadata (e.g., agent name, creative iteration number).
  2. On page refresh, all chat messages are loaded and rendered in chronological order.
  3. Streamed agent responses are stored as their final complete text (not as individual tokens).
  4. Inline UI elements (approval buttons, market selection) are restored in their current state: if the user has already acted on them, they show the decision made; if the user has not yet acted, they are re-rendered as interactive.
  5. Images in chat messages are restored via their serving URLs.
  6. Previous creative iterations are displayed with their iteration numbers (e.g., "Creative v1", "Creative v2").
- **Error handling**: If chat history is partially corrupted, display the messages that can be parsed and log a warning. Do not block the user from continuing.
- **Acceptance criteria**:
  - Given a campaign has progressed through Planning and Creative Generation, when the user refreshes, then all chat messages (brief submission, plan output, creative output) are visible in order.
  - Given the user rejected creative v1 and is viewing creative v2 at the approval gate, when the user refreshes, then both creative v1 and v2 are visible in chat history with iteration labels.
  - Given the approval gate was pending (user has not yet approved/rejected), when the user refreshes, then the approval UI is re-rendered as interactive.

### FR-5: Database Unreachable — Error Message

- **Description**: If the database is unreachable, the system displays an explicit error message. There is no silent degradation or in-memory fallback.
- **Input**: Any database operation fails due to connectivity issues.
- **Output**: An error message is displayed to the user.
- **Behavior**:
  1. On page load, the frontend attempts to load campaign state. If the backend cannot reach the database, it returns an error response.
  2. The frontend displays: "Unable to connect to the database. Campaign data cannot be saved or restored. Please try again later."
  3. No workflow actions are permitted while the database is unreachable — the user cannot submit a brief or continue a campaign.
  4. A "Retry" button is provided. Clicking it re-attempts the database connection.
  5. During workflow execution, if a stage persist fails (see FR-1), the workflow halts with a similar error.
  6. The system does **not** fall back to in-memory storage. This is an explicit non-goal per the PRD.
- **Error handling**: This FR *is* the error handling specification for database failures.
- **Acceptance criteria**:
  - Given the database is unreachable on page load, when the frontend receives the error, then an error message is displayed and no campaign actions are available.
  - Given the database becomes unreachable during workflow execution, when a persist operation fails, then the workflow halts and an error message with retry is shown.
  - Given the database was unreachable, when the user clicks "Retry" and the database is now reachable, then the application recovers and the user can proceed.
  - The system never silently stores data in memory when the database is down.

### FR-6: Completion Summary Card

- **Description**: After the campaign workflow completes, a summary card is displayed showing all campaign results in one place.
- **Input**: Campaign workflow reaches `complete` status.
- **Output**: A summary card rendered in the chat panel.
- **Behavior**:
  1. The completion summary card is displayed as a special message in the chat after the final stage completes.
  2. The card displays:
     - **Campaign name** (from the plan).
     - **AI-generated image** (the approved version, displayed at a readable size).
     - **Caption** (the approved English caption).
     - **Hashtags** (the approved English hashtags).
     - **Review report summary** (verdict and key findings).
     - **Translations** (per-market caption and hashtags, if localization was performed). If localization was skipped, this section shows "Localization skipped".
  3. The card is styled as a distinct, visually prominent block — not just more chat text.
  4. A **"New Campaign"** button is displayed below or within the summary card.
  5. The summary card is persisted and re-rendered on page refresh if the campaign is complete.
- **Error handling**: If any piece of summary data is missing (e.g., translations are null because localization was skipped), the corresponding section is omitted or shows an appropriate label ("Localization skipped").
- **Acceptance criteria**:
  - Given the campaign completes with localization, when the summary card renders, then it shows the image, caption, hashtags, review report, and all translations.
  - Given the campaign completes without localization, when the summary card renders, then translations section shows "Localization skipped".
  - Given the campaign is complete, when the user refreshes the page, then the summary card is still displayed.
  - The "New Campaign" button is visible on the summary card.

### FR-7: "New Campaign" — Clear and Start Fresh

- **Description**: The "New Campaign" button clears the current campaign chat and starts a fresh workflow.
- **Input**: User clicks the "New Campaign" button.
- **Output**: The chat is cleared, the timeline resets, and the user can submit a new brief.
- **Behavior**:
  1. The "New Campaign" button is available on the completion summary card (after campaign completes) and optionally in the application header/toolbar at all times.
  2. If a campaign is **in progress** (not yet complete), clicking "New Campaign" triggers a confirmation dialog: "You have an active campaign. Starting a new one will abandon the current campaign. Continue?" with "Cancel" and "Confirm" options.
  3. If the campaign is **complete**, no confirmation is needed — the new campaign starts immediately.
  4. On confirmation (or if no confirmation is needed):
     a. The current campaign is marked as `archived` in the database (not deleted).
     b. The chat panel is cleared of all messages.
     c. The timeline resets to all-pending state.
     d. A new campaign record is created in the database with status `idle`.
     e. The user can now type a new brief.
  5. The archived campaign data (including images) is retained in storage. It is not accessible via the UI (per PRD non-goal: no campaign history UI), but it is not immediately deleted.
- **Error handling**: If archiving the old campaign fails, show an error and do not proceed with the new campaign.
- **Acceptance criteria**:
  - Given the campaign is complete, when the user clicks "New Campaign", then the chat clears and the timeline resets without a confirmation prompt.
  - Given the campaign is in progress, when the user clicks "New Campaign", then a confirmation dialog appears.
  - Given the user confirms, when the new campaign starts, then the old campaign is archived and the chat is clear.
  - Given the user cancels, when the dialog closes, then the current campaign continues unchanged.

### FR-8: Campaign Data Lifecycle

- **Description**: Defines what happens to campaign data over time, including when new campaigns start.
- **Input**: "New Campaign" action; system cleanup policies.
- **Output**: Old campaign data is archived; new campaign data is initialized.
- **Behavior**:
  1. When a new campaign starts, the previous campaign is marked as `archived` (see FR-7).
  2. Archived campaigns are **not deleted immediately**. They remain in the database and image storage.
  3. Only one campaign can be `active` (non-archived) at a time (per PRD: single-user, no concurrent campaigns).
  4. There is no campaign history UI — archived campaigns are inaccessible to the user.
  5. A future cleanup policy may delete archived campaigns after a retention period, but this is not implemented in the initial version. No automatic deletion occurs.
  6. Chat history is stored as part of the campaign record and follows the same lifecycle (archived with the campaign, not separately deleted).
- **Error handling**: N/A — lifecycle rules are enforced at the data layer.
- **Acceptance criteria**:
  - Given a new campaign is started, when the previous campaign is archived, then it is no longer returned by the "get current campaign" API.
  - Given only one campaign can be active, when the system is queried for the current campaign, then at most one campaign is returned.
  - Archived campaign images remain in storage (not deleted).

## 4. Data Model

```typescript
/** Workflow status — tracks the current position in the pipeline */
type WorkflowStatus =
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

/** Campaign lifecycle state */
type CampaignLifecycle = 'active' | 'archived';

/** Structured campaign plan */
interface CampaignPlan {
  campaignName: string;
  objective: string;
  targetAudience: string;
  keyMessages: string[];
  visualDirection: string;
  tone: string;
  platform: string;
}

/** A single creative iteration (one pass through the Creative Generator) */
interface CreativeIteration {
  iterationNumber: number;
  imageStoragePath: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  reviewReport: CopyReviewReport;
  createdAt: string; // ISO timestamp
}

/** Copy review finding */
interface CopyReviewFinding {
  type: 'brand-alignment' | 'legal' | 'tone';
  severity: 'info' | 'warning' | 'critical';
  detail: string;
}

/** Copy review report */
interface CopyReviewReport {
  verdict: 'pass' | 'flag';
  findings: CopyReviewFinding[];
}

/** Approval decision */
interface ApprovalDecision {
  decision: 'approved' | 'rejected';
  feedback?: string;
  rejectionScope?: 'regenerate-all' | 'keep-image-redo-text';
  iterationNumber: number;
  hadFlags: boolean;
  timestamp: string; // ISO timestamp
}

/** Localized content for a single market */
interface MarketTranslation {
  market: 'spain' | 'france' | 'germany' | 'brazil' | 'japan';
  language: string;
  caption: string;
  hashtags: string[];
}

/** A single chat message */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'status';
  content: string;
  timestamp: string; // ISO timestamp
  metadata?: {
    agentName?: string;
    creativeIteration?: number;
    messageType?: 'text' | 'plan' | 'creative-preview' | 'review-report' | 'approval-gate' | 'market-selection' | 'localization-result' | 'summary' | 'error' | 'status';
  };
}

/** The full campaign record persisted to the database */
interface CampaignRecord {
  id: string;
  lifecycle: CampaignLifecycle;
  workflowStatus: WorkflowStatus;
  brief: string;
  plan?: CampaignPlan;
  creativeIterations: CreativeIteration[];
  currentCreativeIteration: number;
  approvalHistory: ApprovalDecision[];
  selectedMarkets?: string[];
  translations?: MarketTranslation[];
  chatHistory: ChatMessage[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

## 5. API Contracts

### GET `/api/campaigns/current`

Retrieve the current active campaign with all data. Used on page load for resumption.

- **Method**: `GET`
- **Path**: `/api/campaigns/current`
- **Response 200**: `CampaignRecord` (full campaign data)
- **Response 404**: No active campaign — returns `{ "error": "No active campaign" }`.
- **Response 503**: Database unreachable — returns `{ "error": "Database unreachable", "details": "..." }`.
- **Note**: The `GET /api/campaigns/current` endpoint returns the full `CampaignRecord`. The frontend derives timeline state from `workflowStatus` using the mapping table defined in frd-campaign-timeline.md. No separate timeline endpoint is needed.

### POST `/api/campaigns`

Create a new campaign. Archives any existing active campaign.

- **Method**: `POST`
- **Path**: `/api/campaigns`
- **Request body**:
  ```json
  { "brief": "Launch a summer fitness campaign" }
  ```
- **Response 201**: `{ "id": "campaign-uuid", "workflowStatus": "idle" }`
- **Response 503**: Database unreachable — returns `{ "error": "Database unreachable" }`.

### GET `/api/campaigns/:campaignId/images/:iterationNumber`

Serve a generated image for a specific creative iteration.

- **Method**: `GET`
- **Path**: `/api/campaigns/:campaignId/images/:iterationNumber`
- **Response 200**: Binary image data with `Content-Type: image/png`.
- **Response 404**: Image not found — returns `{ "error": "Image not found" }`.

### POST `/api/campaigns/current/archive`

Archive the current campaign (called when starting a new campaign).

- **Method**: `POST`
- **Path**: `/api/campaigns/current/archive`
- **Response 200**: `{ "archived": true, "campaignId": "..." }`
- **Response 404**: No active campaign to archive.
- **Response 503**: Database unreachable.

## 6. UI/UX Requirements

### Page Refresh Behavior
- On page load, a loading spinner is shown while campaign data is fetched.
- If a campaign exists, the chat is populated with all previous messages and the timeline is restored.
- If no campaign exists, the chat is empty with a placeholder prompt (e.g., "Describe your marketing campaign to get started").

### Database Error State
- A full-screen or prominent banner error message is shown: "Unable to connect to the database. Campaign data cannot be saved or restored."
- A "Retry" button is centered below the error message.
- The chat input is disabled while the database is unreachable.
- No other UI elements (timeline, chat) are interactive.

### Completion Summary Card
- Rendered as a visually distinct card in the chat (e.g., elevated card with border, background color, or shadow).
- Sections: Campaign Name (heading), Image (displayed at medium size), Caption, Hashtags (as styled tags/badges), Review Report (verdict with colored indicator, findings list), Translations (grouped by market, each with caption and hashtags).
- "New Campaign" button is prominently placed at the bottom of the card.

### New Campaign Confirmation Dialog
- Modal dialog with warning icon.
- Text: "You have an active campaign. Starting a new one will abandon the current campaign. Continue?"
- Two buttons: "Cancel" (secondary) and "Confirm" (primary/destructive).

### Loading/Saving Indicators
- When data is being persisted (stage transition), a subtle saving indicator appears (e.g., small spinner or "Saving..." text near the timeline).
- The indicator disappears once the persist is confirmed.

## 7. Dependencies

| Dependency | Direction | Description |
|------------|-----------|-------------|
| `campaign-planning` | Upstream | Plan data is persisted after the Planner completes. |
| `creative-generation` | Upstream | Creative assets (image, caption, hashtags) are persisted after the Creative Generator completes. |
| `copy-review` | Upstream | Review report is persisted after the Copy Reviewer completes. |
| `human-approval` | Upstream | Approval decisions and rejection feedback are persisted. |
| `localization` | Upstream | Translations are persisted after the Localizer completes. |
| `campaign-timeline` | Sibling | Timeline state is derived from persisted workflow status. |
| `chat-interface` | Sibling | Chat history is part of persisted campaign data; chat UI consumes it on refresh. |
| Database (PostgreSQL/CosmosDB) | Infrastructure | Required for all persistence operations. |
| Blob/File Storage | Infrastructure | Required for image storage and serving. |

## 8. Acceptance Criteria Summary

1. Campaign data is saved to the database after each pipeline stage completes (planning, creative generation, review, approval, localization, complete).
2. Generated images are stored persistently and are retrievable via URL.
3. All creative iterations (including rejected ones) are retained and accessible.
4. Page refresh restores the campaign to the last completed stage — chat history, timeline, and workflow state are all restored.
5. Chat history is fully restored on refresh, including inline UI elements in their correct state (acted on or interactive).
6. If the database is unreachable, an error message is displayed and no workflow actions are permitted (no silent in-memory fallback).
7. A "Retry" button is available when the database is unreachable.
8. A completion summary card displays image, caption, hashtags, review report, and translations (or "Localization skipped") after the workflow finishes.
9. A "New Campaign" button on the summary card clears the chat and resets the timeline for a fresh start.
10. Starting a new campaign while one is in progress requires user confirmation.
11. Old campaign data is archived (not deleted) when a new campaign starts.
12. At most one campaign is active at any time.
13. Persist failures halt the workflow and show an error with retry — the workflow does not advance with unsaved data.
