# FRD: Campaign Planning

**Feature ID**: `campaign-planning`
**PRD Reference**: §4.2 Campaign Planning (Agent 1)
**Status**: Draft

## 1. Overview

The Campaign Planning feature implements the first agent in the marketing campaign pipeline. It accepts a user's free-text campaign brief, validates it, fills in smart defaults for underspecified fields, and produces a structured campaign strategy with seven typed fields. The structured plan is streamed to the chat as formatted markdown and then automatically handed off to the Creative Generator agent. This agent is the entry point of the AI pipeline and sets the strategic foundation for all downstream agents.

## 2. User Stories

This FRD covers the following user stories from the PRD:

- **US-1**: As a campaign creator, I want to describe a marketing campaign in plain English so that I don't need to fill out structured forms.
- **US-2**: As a campaign creator, I want the Campaign Planner agent to turn my brief into a structured strategy so that I can see a clear plan before creative work begins.
- **US-3**: As a campaign creator, I want smart defaults filled in when my brief is vague so that the workflow proceeds without forcing me to specify every detail.
- **US-4**: As a campaign creator, I want the structured plan displayed as formatted markdown in the chat so that I can read it clearly.
- **US-20**: As a campaign creator, I want the system to automatically retry failed AI calls so that transient errors don't disrupt my workflow.

## 3. Functional Requirements

### FR-1: Accept Free-Text Brief

- **Description**: The Campaign Planner accepts a free-text campaign brief from the user as its input.
- **Input**: A plain-English string describing the desired marketing campaign.
- **Output**: The brief is captured and passed to the planning LLM for processing.
- **Behavior**:
  1. The user submits a free-text message in the chat (handled by the chat-interface feature).
  2. The Campaign Planner agent receives the raw brief string.
  3. The brief is the sole input — no structured form fields, no templates.
  4. The brief is trimmed of leading/trailing whitespace before validation.
  5. The original brief text is preserved in the campaign data for reference by downstream agents.
- **Error handling**: If the brief cannot be received (e.g., internal error), an error is surfaced in the chat.
- **Acceptance criteria**:
  - Given a user submits "Launch a summer fitness campaign," when the planner receives it, then the full text is available for processing.
  - Given a brief with leading/trailing whitespace, when the planner receives it, then the whitespace is trimmed.

### FR-2: Empty/Short Brief Validation

- **Description**: Briefs that are empty or too short (fewer than 10 characters after trimming) are rejected with a prompt for more detail.
- **Input**: A brief string of fewer than 10 characters (after trimming).
- **Output**: A message prompting the user to provide more detail; the pipeline does NOT start.
- **Behavior**:
  1. After trimming whitespace, the brief length is checked.
  2. If the brief is empty (0 characters), the system responds: "Please describe your campaign idea. Tell me what you'd like to promote, your target audience, and any preferences."
  3. If the brief is 1–9 characters, the system responds: "Your brief is too short. Please provide at least 10 characters describing your campaign."
  4. The pipeline does NOT invoke the LLM for briefs below the threshold.
  5. The input field is re-enabled so the user can submit a longer brief.
  6. The validation message is displayed as an assistant message in the chat.
- **Error handling**: Not applicable — this IS the error handling for short briefs.
- **Acceptance criteria**:
  - Given the user submits an empty string, when the planner validates it, then a prompt message is displayed and the pipeline does not start.
  - Given the user submits "Hi" (2 characters), when the planner validates it, then a "too short" message is displayed and the pipeline does not start.
  - Given the user submits "Launch summer" (13 characters), when the planner validates it, then the brief is accepted and planning begins.

### FR-3: Brief Length Limit

- **Description**: Briefs exceeding 2000 characters are truncated, and the user is notified of the truncation.
- **Input**: A brief string exceeding 2000 characters.
- **Output**: The brief is truncated to 2000 characters; a notification is shown to the user.
- **Behavior**:
  1. After trimming whitespace, if the brief exceeds 2000 characters, it is truncated to the first 2000 characters.
  2. A system message is displayed in the chat: "Your brief exceeded 2000 characters and has been shortened. The planner will use the first 2000 characters."
  3. The truncated brief is used for planning — the planner does NOT reject it.
  4. Truncation happens at the character boundary (no word-boundary splitting required).
- **Error handling**: Not applicable — truncation is the handling.
- **Acceptance criteria**:
  - Given the user submits a 2500-character brief, when the planner processes it, then only the first 2000 characters are used and the user is notified.
  - Given the user submits a 1999-character brief, when the planner processes it, then the full brief is used with no truncation notification.

### FR-4: Structured Plan Generation

- **Description**: The Campaign Planner invokes the LLM to produce a structured campaign plan with seven typed fields from the user's brief.
- **Input**: The validated (and possibly truncated) brief string.
- **Output**: A `CampaignPlan` object with all seven fields populated.
- **Behavior**:
  1. The planner sends the brief to the LLM with a system prompt instructing it to produce a structured campaign plan.
  2. The LLM is instructed to extract or infer the following seven fields:
     - `campaignName` (string, required) — a generated campaign name.
     - `objective` (string, required) — the campaign objective.
     - `targetAudience` (string, required) — the target audience.
     - `keyMessages` (string[], required) — 2 to 5 key messages.
     - `visualDirection` (string, required) — description of visual style/mood for the creative.
     - `tone` (string, required) — brand voice tone.
     - `platform` (string, required) — target social media platform.
  3. All fields must be present in the output. The LLM response is parsed and validated.
  4. `keyMessages` must contain between 2 and 5 items. If the LLM returns fewer than 2, the agent adds generic messages to reach 2. If more than 5, the list is truncated to 5.
  5. The structured plan is stored in the campaign state for downstream agents.
- **Error handling**: If the LLM response cannot be parsed into a valid plan (missing fields, wrong types), the agent retries the LLM call (up to 3 total attempts — 1 initial + 2 retries). If all retries fail, an error is surfaced.
- **Acceptance criteria**:
  - Given a brief "Launch a summer fitness campaign," when the planner generates a plan, then all seven fields are populated and non-empty.
  - Given the LLM returns 1 key message, when the plan is validated, then the list is padded to at least 2.
  - Given the LLM returns 7 key messages, when the plan is validated, then the list is truncated to 5.

### FR-5: Smart Defaults

- **Description**: When the brief does not specify certain fields, the planner fills them with predefined smart defaults.
- **Input**: A brief that is vague or missing explicit platform, audience, or tone information.
- **Output**: The plan has defaults applied for unspecified fields.
- **Behavior**:
  1. The LLM is instructed (via system prompt) to apply the following defaults when the brief does not explicitly specify:
     - `platform` → "Instagram"
     - `targetAudience` → "General audience"
     - `tone` → "Professional"
  2. If the brief explicitly specifies a platform (e.g., "Twitter campaign"), the specified value is used instead of the default.
  3. If the brief explicitly specifies an audience (e.g., "targeting millennials"), the specified value is used.
  4. If the brief explicitly specifies a tone (e.g., "playful and fun"), the specified value is used.
  5. Post-LLM validation checks: if `platform` is empty, set to "Instagram"; if `targetAudience` is empty, set to "General audience"; if `tone` is empty, set to "Professional."
- **Error handling**: Not applicable — defaults are always applied as a fallback.
- **Acceptance criteria**:
  - Given a brief "Promote our new coffee blend," when the plan is generated, then `platform` is "Instagram," `targetAudience` is "General audience," and `tone` is "Professional."
  - Given a brief "Create a playful TikTok campaign for Gen Z," when the plan is generated, then `platform` is "TikTok" (not the default), `targetAudience` reflects "Gen Z," and `tone` reflects "playful."

### FR-6: Markdown Output Format

- **Description**: The plan is output as formatted markdown in the chat, making it human-readable.
- **Input**: The completed `CampaignPlan` object.
- **Output**: A formatted markdown representation streamed to the chat.
- **Behavior**:
  1. The planner streams an explanatory introduction (e.g., "Here's the campaign strategy based on your brief:").
  2. After the streamed text, the structured plan is rendered as a formatted markdown block:
     ```
     ## Campaign Plan
     **Campaign Name:** {campaignName}
     **Objective:** {objective}
     **Target Audience:** {targetAudience}
     **Platform:** {platform}
     **Tone:** {tone}
     **Visual Direction:** {visualDirection}
     ### Key Messages
     1. {keyMessages[0]}
     2. {keyMessages[1]}
     ...
     ```
  3. The explanatory text streams token-by-token; the structured plan block is delivered atomically (per `chat-interface` FR-5).
- **Error handling**: If markdown rendering fails, the raw text is displayed.
- **Acceptance criteria**:
  - Given a plan is generated, when it is displayed in the chat, then it appears as formatted markdown with all seven fields.
  - Given the plan renders, when the user reads it, then the explanatory text was streamed and the structured block appeared atomically.

### FR-7: Auto-Handoff to Creative Generator

- **Description**: After the plan is generated and displayed, the workflow automatically hands off to the Creative Generator agent without requiring user action.
- **Input**: A completed and displayed campaign plan.
- **Output**: The Creative Generator agent is invoked with the structured plan.
- **Behavior**:
  1. Once the plan is fully generated, stored, and displayed, the planner signals completion.
  2. The orchestration layer automatically invokes the Creative Generator agent, passing the `CampaignPlan` as input.
  3. No user button click or confirmation is required — the handoff is automatic.
  4. The timeline updates to show the "Planning" stage as complete and "Generating" as active.
  5. A brief transition message may appear in the chat (e.g., "Starting creative generation…").
- **Error handling**: If the handoff fails (e.g., orchestration error), the error handling in `chat-interface` FR-8 applies — the system retries, and on failure, shows an error with a retry button.
- **Acceptance criteria**:
  - Given the plan is displayed, when the planner completes, then the Creative Generator agent starts automatically.
  - Given the handoff occurs, when the timeline updates, then "Planning" is complete and "Generating" is active.

### FR-8: LLM Failure Handling with Retries

- **Description**: If the LLM call for plan generation fails, the system makes up to 3 total attempts (1 initial + 2 retries) before surfacing an error.
- **Input**: A failed LLM call during plan generation.
- **Output**: Either a successful plan (after retry) or an error message with a retry button.
- **Behavior**:
  1. If the LLM call fails (network error, timeout, rate limit, malformed response), the system retries automatically.
  2. Up to 3 total attempts (1 initial + 2 retries) are made with exponential backoff (1s, 2s).
  3. Retries are invisible to the user — the loading/streaming state continues.
  4. If all 3 attempts fail, an error message is displayed in the chat: "Campaign planning failed. The AI service is temporarily unavailable."
  5. A "Retry" button is displayed. Clicking it re-invokes the planner from the beginning with the same brief.
  6. Malformed LLM responses (valid HTTP but unparseable plan) also trigger retries.
- **Error handling**: This IS the error handling for LLM failures.
- **Acceptance criteria**:
  - Given the LLM call fails once and succeeds on retry, when the plan generates, then the user sees only the successful result (retry was invisible).
  - Given all 3 LLM attempts fail, when the error surfaces, then an error message and "Retry" button are shown.
  - Given the user clicks "Retry" after failure, when the planner re-runs, then it uses the same original brief.

## 4. Data Model

```typescript
/** The structured campaign plan — core output of the Campaign Planner */
interface CampaignPlan {
  campaignName: string;           // Generated campaign name
  objective: string;              // Campaign objective
  targetAudience: string;         // Target audience (default: "General audience")
  keyMessages: string[];          // 2–5 key messages
  visualDirection: string;        // Visual style/mood description for creative
  tone: string;                   // Brand voice tone (default: "Professional")
  platform: string;               // Target platform (default: "Instagram")
}

/** Smart default values applied when the brief is vague */
const PLAN_DEFAULTS = {
  platform: 'Instagram',
  targetAudience: 'General audience',
  tone: 'Professional',
} as const;

/** Brief validation constants */
const BRIEF_MIN_LENGTH = 10;
const BRIEF_MAX_LENGTH = 2000;

/** Planner agent input */
interface PlannerInput {
  brief: string;                  // Raw user brief (trimmed, possibly truncated)
  originalBriefLength: number;    // Original length before truncation (for notification)
}

/** Planner agent output */
interface PlannerOutput {
  plan: CampaignPlan;
  wasDefaultApplied: {
    platform: boolean;
    targetAudience: boolean;
    tone: boolean;
  };
}

/** Campaign state after planning stage */
interface CampaignAfterPlanning {
  id: string;
  brief: string;
  plan: CampaignPlan;
  stage: 'planning-complete' | 'planning-error';
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

// On permanent failure (all 3 attempts exhausted), the campaign stage is set to
// 'planning-error'. The user can click the retry button to re-attempt.
```

## 5. API Contracts

### Submit Campaign Brief (triggers planner)

- **Method**: `POST`
- **Path**: `/api/campaign`
- **Request body**:
  ```json
  {
    "brief": "Launch a summer fitness campaign targeting millennials"
  }
  ```
- **Validation**:
  - `brief` is required, must be a string.
  - After trimming, if length < 10, return `400` with `{ error: "Brief too short", minLength: 10 }`.
  - If length > 2000, truncate to 2000 and proceed (include `truncated: true` in response).
- **Response** (success):
  ```json
  {
    "campaignId": "camp_abc123",
    "truncated": false
  }
  ```
- **Response** (brief too short):
  ```json
  {
    "error": "Brief too short",
    "minLength": 10,
    "actualLength": 3
  }
  ```
  Status: `400`

### Get Campaign Plan

- **Method**: `GET`
- **Path**: `/api/campaign/{campaignId}/plan`
- **Response**:
  ```json
  {
    "plan": {
      "campaignName": "Summer Fitness Blitz",
      "objective": "Drive awareness for summer fitness products",
      "targetAudience": "Millennials aged 25-35",
      "keyMessages": ["Get fit this summer", "Join the movement"],
      "visualDirection": "Bright, energetic outdoor scenes",
      "tone": "Motivational",
      "platform": "Instagram"
    },
    "defaultsApplied": {
      "platform": false,
      "targetAudience": false,
      "tone": false
    }
  }
  ```

## 6. UI/UX Requirements

- **Brief input**: The user types a free-text message in the chat input (shared with `chat-interface`). No separate form.
- **Validation messages**: Too-short and truncation notifications appear as assistant messages in the chat, styled as informational (not error-red).
- **Streaming plan**: The planner's explanatory text streams token-by-token. The structured plan block appears atomically after the text.
- **Plan display**: The structured plan renders as a formatted markdown card with clear field labels and values. Key messages are numbered.
- **Transition**: After the plan renders, a brief system message indicates handoff to the Creative Generator (e.g., "Starting creative generation…").
- **Loading state**: While the planner is processing, a typing indicator or loading animation is shown in the chat.

## 7. Dependencies

- **`chat-interface`**: Provides the input mechanism, streaming display, and error/retry UX.
- **LLM service**: An external LLM (e.g., GPT-4) must be available and configured for plan generation.
- **`data-persistence`**: The campaign plan must be persisted after generation.
- **`campaign-timeline`**: The timeline must reflect the "Planning" stage as active/complete.
- **`creative-generation`**: The downstream agent that receives the plan via auto-handoff.

## 8. Acceptance Criteria Summary

1. A brief like "Launch a summer fitness campaign" produces a complete plan with all 7 schema fields populated.
2. Missing platform, audience, and tone fields are filled with the specified defaults ("Instagram," "General audience," "Professional").
3. A brief explicitly specifying platform, audience, or tone uses the specified values (not defaults).
4. The plan is rendered as formatted markdown in the chat.
5. The explanatory text streams token-by-token; the structured plan appears atomically.
6. Handoff to the Creative Generator happens automatically after the plan is displayed (no user action).
7. A brief shorter than 10 characters (after trimming) is rejected with a prompt for more detail; the pipeline does not start.
8. A brief longer than 2000 characters is truncated to 2000 characters and the user is notified.
9. `keyMessages` contains between 2 and 5 items (padded or truncated if necessary).
10. LLM failures are retried up to 3 total attempts (1 initial + 2 retries) automatically; on total failure, an error message with a "Retry" button is shown.
11. The timeline shows "Planning" as active during generation and complete after handoff.
