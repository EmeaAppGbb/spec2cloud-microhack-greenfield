# FRD: Copy Review

**Feature ID**: `copy-review`
**PRD Reference**: §4.4 Copy Review (Agent 3)
**Status**: Draft

## 1. Overview

The Copy Reviewer is the third agent in the campaign pipeline. It receives the creative output (caption, hashtags) along with the campaign plan and evaluates brand alignment, tone consistency, and potential legal issues. It produces a structured review report with a verdict and typed findings, then automatically hands off to the Human Approval Gate. This agent acts as an automated quality gate ensuring creative content meets brand standards before human review.

## 2. User Stories

- **US-6**: As a campaign creator, I want the Copy Reviewer agent to check the caption and hashtags against the campaign's brand tone and flag potential legal issues so that I can trust the output before publishing.

## 3. Functional Requirements

### FR-1: Receive Creative Package and Campaign Context

- **Description**: The Copy Reviewer receives the creative output and the original campaign plan to perform a contextual review.
- **Input**: Caption (string), hashtags (string[]), and the full campaign plan object (containing `tone`, `keyMessages`, `targetAudience`, `objective`, `platform`).
- **Output**: Acknowledgement that inputs are valid and review can proceed.
- **Behavior**:
  1. The agent receives the caption, hashtags array, and campaign plan from the Creative Generator handoff.
  2. All three inputs must be present. If any input is missing or empty, the agent produces an error finding rather than crashing.
  3. The campaign plan provides context for brand alignment checks — specifically `tone`, `keyMessages`, and `targetAudience`.
- **Error handling**: If the caption is empty or hashtags array is empty, the agent produces a "flag" verdict with a critical finding indicating missing content. The review still completes (does not throw).
- **Acceptance criteria**:
  - Given a creative package with caption, hashtags, and campaign plan, When the Copy Reviewer receives them, Then it proceeds to review without error.
  - Given a creative package with an empty caption, When the Copy Reviewer receives it, Then the verdict is "flag" with a critical finding about missing caption.

### FR-2: Brand Tone Alignment Check

- **Description**: Evaluates whether the caption and hashtags align with the campaign's specified brand tone and key messages.
- **Input**: Caption text, hashtags, campaign plan `tone` and `keyMessages` fields.
- **Output**: Zero or more findings of type `brand-alignment`.
- **Behavior**:
  1. The agent checks whether the caption's language and style match the specified `tone` (e.g., "Professional", "Playful", "Urgent").
  2. The agent checks whether the caption and hashtags reflect or support the `keyMessages` from the plan.
  3. Alignment findings are categorized:
     - `info` severity: minor style observations (e.g., "Caption tone leans casual but matches playful brand voice").
     - `warning` severity: noticeable misalignment (e.g., "Caption uses formal language but campaign tone is Playful").
     - `critical` severity: direct contradiction of key messages or tone (e.g., "Caption promotes discount pricing but key message emphasizes premium positioning").
  4. A perfectly aligned caption may still produce `info`-level findings with positive observations.
- **Error handling**: If the LLM fails to evaluate tone alignment, a finding with type `brand-alignment`, severity `warning`, and detail explaining the evaluation failure is added.
- **Acceptance criteria**:
  - Given a caption that matches the plan's tone, When reviewed, Then findings of type `brand-alignment` have severity `info` or no findings of that type.
  - Given a caption that contradicts the plan's key messages, When reviewed, Then at least one finding of type `brand-alignment` with severity `warning` or `critical` is produced.

### FR-3: Legal Issue Detection

- **Description**: Flags potential legal issues in the caption and hashtags, such as unsubstantiated claims or missing disclaimers.
- **Input**: Caption text, hashtags.
- **Output**: Zero or more findings of type `legal`.
- **Behavior**:
  1. The agent scans for unsubstantiated superlative claims (e.g., "best in the world", "#1 rated", "guaranteed results").
  2. The agent scans for health, financial, or safety claims that may require disclaimers.
  3. The agent scans for potential trademark issues in hashtags (e.g., using competitor brand names).
  4. The agent checks for missing disclaimers when promotional language is detected (e.g., "limited time offer" without terms).
  5. Legal findings are categorized:
     - `info` severity: general observation, no action needed (e.g., "Caption uses promotional language but within acceptable bounds").
     - `warning` severity: potential issue that should be reviewed (e.g., "Claim 'proven results' may require substantiation").
     - `critical` severity: likely legal risk requiring attention (e.g., "Health claim 'cures anxiety' requires medical disclaimer").
- **Error handling**: If the LLM fails to evaluate legal issues, a finding with type `legal`, severity `warning`, and detail explaining the evaluation failure is added.
- **Acceptance criteria**:
  - Given a caption with the phrase "guaranteed weight loss", When reviewed, Then at least one finding of type `legal` with severity `warning` or `critical` is produced.
  - Given a caption with no superlative or regulated claims, When reviewed, Then no `legal` findings with severity `warning` or `critical` are produced.

### FR-4: Tone Consistency Check

- **Description**: Evaluates internal consistency of tone across the caption and hashtags.
- **Input**: Caption text, hashtags.
- **Output**: Zero or more findings of type `tone`.
- **Behavior**:
  1. The agent checks whether the tone of the hashtags is consistent with the tone of the caption.
  2. The agent checks for mixed tones within the caption itself (e.g., starting formal and ending with slang).
  3. Tone findings follow the same severity scale (`info`, `warning`, `critical`).
- **Error handling**: Same as FR-2/FR-3 — LLM failure produces a warning-level finding.
- **Acceptance criteria**:
  - Given a caption with a formal tone and hashtags with slang, When reviewed, Then at least one finding of type `tone` with severity `warning` is produced.

### FR-5: Review Report Generation

- **Description**: Produces the structured review report with a verdict and findings array.
- **Input**: All findings from FR-2, FR-3, FR-4.
- **Output**: A `CopyReviewReport` object.
- **Behavior**:
  1. All findings from the three checks are aggregated into a single `findings` array.
  2. The verdict is determined:
     - `"pass"` — no findings have severity `warning` or `critical`. May still contain `info` findings.
     - `"flag"` — at least one finding has severity `warning` or `critical`.
  3. The findings array preserves the order: brand-alignment findings first, then legal, then tone.
  4. An empty findings array results in a `"pass"` verdict.
- **Error handling**: If report generation itself fails, a minimal report with verdict `"flag"` and a single critical finding describing the generation failure is produced.
- **Acceptance criteria**:
  - Given findings with only `info` severity, When the report is generated, Then the verdict is `"pass"`.
  - Given findings with at least one `warning` severity, When the report is generated, Then the verdict is `"flag"`.
  - Given findings with at least one `critical` severity, When the report is generated, Then the verdict is `"flag"`.
  - Given no findings at all, When the report is generated, Then the verdict is `"pass"` with an empty findings array.

### FR-6: Markdown Output in Chat

- **Description**: The review report is rendered as formatted markdown in the chat interface.
- **Input**: `CopyReviewReport` object.
- **Output**: Markdown-formatted review displayed in the chat.
- **Behavior**:
  1. The report streams an explanatory preamble text token-by-token (e.g., "I've reviewed the caption and hashtags…").
  2. After the streaming text, the structured report data (`verdict`, `findings`) is delivered atomically (not streamed).
  3. The markdown rendering includes:
     - A clear verdict indicator (e.g., ✅ Pass or ⚠️ Flagged).
     - Each finding displayed with its type, severity (color-coded or icon-marked), and detail.
     - Findings grouped by type.
  4. The report is displayed in the chat before the approval gate activates.
- **Error handling**: If markdown rendering fails, the raw report JSON is displayed as a fallback.
- **Acceptance criteria**:
  - Given a completed review, When displayed in chat, Then the verdict is clearly visible.
  - Given a report with multiple findings, When displayed, Then each finding shows type, severity, and detail.
  - Given the review is complete, When the report is displayed, Then it appears before the approval gate UI.

### FR-7: Auto-Handoff to Human Approval Gate

- **Description**: After the review report is displayed, the workflow automatically transitions to the Human Approval Gate.
- **Input**: Completed review report, creative package (image, caption, hashtags), campaign plan.
- **Output**: Workflow state transition to `human-approval`.
- **Behavior**:
  1. Once the review report markdown is fully rendered in the chat, the agent signals completion.
  2. The workflow automatically transitions to the Human Approval Gate — no user action is required.
  3. The full context (image URL, caption, hashtags, review report, campaign plan) is passed to the approval gate. The image URL from the Creative Generator is carried forward in the workflow state and included in the approval gate context.
  4. The campaign timeline updates: "Reviewing" stage completes, "Awaiting Approval" stage becomes active.
- **Error handling**: If the handoff fails, the system retries the transition. If it continues to fail, an error message is shown with a manual retry button.
- **Acceptance criteria**:
  - Given a completed review report, When displayed in chat, Then the approval gate activates automatically without user action.
  - Given the handoff occurs, When the timeline updates, Then "Reviewing" shows as complete and "Awaiting Approval" shows as active.

### FR-8: LLM Failure Handling with Retries

- **Description**: The Copy Reviewer automatically retries failed LLM calls up to 3 total attempts (1 initial + 2 retries) before surfacing an error.
- **Input**: Any LLM call within the review process.
- **Output**: Either a successful response or an error after all 3 attempts are exhausted.
- **Behavior**:
  1. Each LLM call (brand alignment, legal check, tone check) is independently retried on failure.
  2. Retry strategy: up to 3 total attempts per call (1 initial + 2 retries) with exponential backoff (1s, 2s).
  3. If a specific check fails after all 3 attempts are exhausted, a finding with the appropriate type, severity `warning`, and a detail message explaining the failure is added to the report. The review continues with the remaining checks.
  4. If all LLM calls fail after retries, the agent produces a report with verdict `"flag"` and critical findings explaining the complete failure, plus a manual retry button is shown in chat.
  5. Transient errors (network timeouts, rate limits) are retried. Non-transient errors (invalid API key, malformed request) are not retried.
- **Error handling**: After all 3 attempts fail for all checks, display an error message in the chat with a manual retry button that re-invokes the entire Copy Reviewer agent.
- **Acceptance criteria**:
  - Given a transient LLM failure on the first attempt, When the system retries, Then the review completes successfully on a subsequent attempt.
  - Given 3 consecutive LLM failures for one check, When retries are exhausted, Then a warning finding is added and the review continues with other checks.
  - Given all LLM calls fail after retries, When the review cannot produce meaningful results, Then an error message with a retry button is displayed.

## 4. Data Model

```typescript
/** Verdict of the copy review */
type CopyReviewVerdict = "pass" | "flag";

/** Category of a review finding */
type FindingType = "brand-alignment" | "legal" | "tone";

/** Severity level of a finding */
type FindingSeverity = "info" | "warning" | "critical";

/** A single finding from the copy review */
interface CopyReviewFinding {
  /** Category of the finding */
  type: FindingType;
  /** Severity level */
  severity: FindingSeverity;
  /** Human-readable description of the finding */
  detail: string;
}

/** The complete copy review report */
interface CopyReviewReport {
  /** Overall assessment */
  verdict: CopyReviewVerdict;
  /** Array of typed, severity-graded findings */
  findings: CopyReviewFinding[];
}

/** Input to the Copy Reviewer agent */
interface CopyReviewInput {
  /** The Instagram caption to review */
  caption: string;
  /** The hashtags to review */
  hashtags: string[];
  /** The campaign plan providing brand context */
  campaignPlan: CampaignPlan;
}

// NOTE: The imageUrl from the Creative Generator is carried through LangGraph
// workflow state (not in CopyReviewInput directly) and passed to the approval gate.

/** Campaign plan fields relevant to copy review */
// CampaignPlan — see frd-campaign-planning.md §4 for canonical definition
```

## 5. API Contracts

### Agent Invocation (Internal — LangGraph Node)

The Copy Reviewer is a LangGraph node, not an HTTP endpoint. It is invoked internally by the agent pipeline.

**Input State:**
```
Method: LangGraph state transition
Input fields:
  - caption: string
  - hashtags: string[]
  - campaignPlan: CampaignPlan
```

**Output State:**
```
Output fields:
  - copyReviewReport: CopyReviewReport
  - nextAgent: "human-approval"
```

### Streaming Protocol

The Copy Reviewer streams explanatory text token-by-token via the CopilotKit/LangGraph streaming protocol, then delivers the structured `CopyReviewReport` atomically as a final message payload.

## 6. UI/UX Requirements

- The review report is displayed as a formatted markdown message in the chat panel.
- The verdict is prominently displayed with a visual indicator:
  - ✅ **Pass** — green accent or check icon.
  - ⚠️ **Flagged** — yellow/orange accent or warning icon.
- Findings are listed below the verdict, grouped by type (`brand-alignment`, `legal`, `tone`).
- Each finding shows:
  - Type label.
  - Severity badge (info = blue/grey, warning = yellow, critical = red).
  - Detail text.
- The streaming preamble text (explanation) appears progressively; the structured report appears atomically after the text completes.
- No user interaction is required during this step — the user reads the report and the workflow auto-advances to the approval gate.

## 7. Dependencies

- **Campaign Planning (`campaign-planning`)**: Provides the campaign plan with `tone` and `keyMessages` used for alignment checks.
- **Creative Generation (`creative-generation`)**: Provides the caption and hashtags to review.
- **Chat Interface (`chat-interface`)**: Renders the review report as markdown and supports token-by-token streaming.
- **Human Approval Gate (`human-approval`)**: Receives the handoff after the review completes.
- **LLM Service**: External AI service for performing the brand alignment, legal, and tone evaluations.

## 8. Acceptance Criteria Summary

| ID | Criterion |
|----|-----------|
| AC-1 | A review report is produced for every creative asset received. |
| AC-2 | The report contains a `verdict` field with value `"pass"` or `"flag"`. |
| AC-3 | The report contains a `findings` array where each finding has `type`, `severity`, and `detail`. |
| AC-4 | A `"flag"` verdict is produced when at least one finding has severity `"warning"` or `"critical"`. |
| AC-5 | A `"pass"` verdict is produced when all findings have severity `"info"` or the findings array is empty. |
| AC-6 | The report is displayed as formatted markdown in the chat before the approval gate activates. |
| AC-7 | The streaming preamble text is delivered token-by-token; the structured report is delivered atomically. |
| AC-8 | The workflow auto-transitions to the Human Approval Gate after the report is displayed. |
| AC-9 | Brand alignment checks reference the campaign plan's `tone` and `keyMessages`. |
| AC-10 | Legal issue detection flags unsubstantiated claims and missing disclaimers. |
| AC-11 | Transient LLM failures are retried up to 3 total attempts (1 initial + 2 retries) with exponential backoff. |
| AC-12 | If a single check fails after retries, a warning finding is added and the review continues. |
| AC-13 | If all checks fail after retries, an error message with a retry button is displayed. |
| AC-14 | An empty caption produces a `"flag"` verdict with a critical finding. |
