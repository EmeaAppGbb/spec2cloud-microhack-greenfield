# FRD: Campaign Timeline & Status

**Feature ID**: `campaign-timeline`
**PRD Reference**: §4.7 Campaign Timeline / Status
**Status**: Draft

## 1. Overview

The Campaign Timeline is a persistent visual component displayed in the right panel of the split-panel layout. It provides real-time feedback on the current state of the campaign workflow by showing six ordered stages, visually distinguishing between completed, active, and pending stages. The timeline reacts to workflow events including stage transitions, rejection loops, and localization skip, giving the user constant awareness of where the pipeline stands.

## 2. User Stories

This FRD covers the following PRD user stories:

- **US-15**: As a campaign creator, I want to see a visual timeline on the right panel showing campaign stages so that I always know where the workflow is.
- **US-8** (partial): As a campaign creator, I want to reject creative assets with written feedback — the timeline must reflect the loop back to Generating.
- **US-12** (partial): As a campaign creator, I want to skip localization entirely — the timeline must reflect the skip.

## 3. Functional Requirements

### FR-1: Display Six Ordered Stages

- **Description**: The timeline displays exactly six stages in a fixed vertical order representing the campaign workflow.
- **Input**: Component renders on page load.
- **Output**: A vertical timeline showing six labeled stages.
- **Behavior**:
  1. The six stages, in order, are: **Planning** → **Generating** → **Reviewing** → **Awaiting Approval** → **Localizing** → **Complete**.
  2. All six stages are always visible in the timeline regardless of current workflow position.
  3. Each stage displays a label and a visual indicator (icon or badge) reflecting its state.
  4. The timeline is rendered in the right panel of the split-panel layout.
  5. On initial page load with no active campaign, all stages are in `pending` state.
- **Error handling**: If stage data is missing or malformed, all stages render as `pending` (safe fallback).
- **Acceptance criteria**:
  - Given the application is loaded, when the user views the right panel, then all six stages are visible in the correct order.
  - Given no campaign is active, when the timeline renders, then all stages appear in the `pending` visual state.

### FR-2: Active Stage Highlight

- **Description**: The currently executing stage is visually highlighted to distinguish it from completed and pending stages.
- **Input**: Workflow state change event indicating a new active stage.
- **Output**: The active stage receives a distinct visual treatment.
- **Behavior**:
  1. Exactly one stage can be `active` at any time (or zero, if the workflow is idle or complete).
  2. The active stage uses a distinct visual treatment (e.g., highlighted color, pulsing animation, bold text, or filled icon) that is clearly differentiable from both `completed` and `pending` states.
  3. When the workflow transitions to a new stage, the previously active stage moves to `completed` and the new stage becomes `active`.
  4. The visual update occurs immediately upon receiving the stage transition event — no polling delay.
- **Error handling**: If the active stage identifier does not match a known stage, the timeline remains unchanged (no crash).
- **Acceptance criteria**:
  - Given the Campaign Planner agent starts, when the timeline updates, then the "Planning" stage is visually highlighted as active.
  - Given the Creative Generator agent starts, when the timeline updates, then "Planning" is shown as completed and "Generating" is highlighted as active.
  - Given the workflow is idle (no campaign), when the timeline renders, then no stage is highlighted as active.

### FR-3: Completed Stage Visual Distinction

- **Description**: Completed stages are visually distinct from both active and pending stages.
- **Input**: A stage transitions from `active` to `completed`.
- **Output**: The completed stage renders with a distinct visual treatment (e.g., checkmark icon, muted color, or strikethrough style).
- **Behavior**:
  1. A stage transitions to `completed` when the next stage becomes `active` (i.e., the agent for the current stage has finished and handed off).
  2. Completed stages retain their `completed` visual state for the duration of the campaign.
  3. Three visual states must be clearly distinguishable: `pending` (not yet reached), `active` (currently executing), and `completed` (finished).
  4. The "Complete" stage itself transitions to `completed` when the entire workflow finishes.
- **Error handling**: N/A — completion is a terminal visual state.
- **Acceptance criteria**:
  - Given the Planner agent has finished, when the timeline renders, then "Planning" is shown as completed (e.g., with a checkmark) and is visually different from active and pending stages.
  - Given stages Planning, Generating, and Reviewing are completed, when the user views the timeline, then all three show completed styling, and the next stage is active or pending.

### FR-4: Real-Time Updates on Stage Transition

- **Description**: The timeline updates in real time as the workflow progresses through stages, without requiring a page refresh.
- **Input**: Backend workflow state change events.
- **Output**: The timeline UI reflects the new state immediately.
- **Behavior**:
  1. Stage transitions are driven by backend workflow state — the frontend receives stage change events from the backend.
  2. The timeline updates when an agent **starts** (its stage becomes `active`) and when it **completes** (its stage becomes `completed`).
  3. Updates are pushed from the backend via the SSE stream defined in frd-chat-interface.md (`GET /api/campaign/{campaignId}/stream`, event type: `stage-transition`) — the frontend does not poll.
  4. If the connection to the backend is interrupted, the timeline retains the last known state (no flicker or reset).
  5. When the connection is restored, the timeline syncs to the current backend state.
- **Error handling**: If a stage transition event is received out of order (e.g., "Complete" before "Localizing"), the timeline ignores the invalid transition and logs a warning.
- **Acceptance criteria**:
  - Given the workflow transitions from Planning to Generating, when the event is received, then the timeline updates within 1 second (no visible delay to the user).
  - Given the backend pushes a stage update, when the frontend receives it, then no page refresh is required.
  - Given the network connection drops and reconnects, when the connection is restored, then the timeline syncs to the correct current state.

### FR-5: Rejection Loop — Timeline Moves Back to Generating

- **Description**: When the user rejects creative assets at the approval gate, the timeline reflects the loop back to the Generating stage.
- **Input**: A rejection event from the Human Approval Gate.
- **Output**: The "Generating" stage becomes `active` again; "Reviewing" and "Awaiting Approval" revert to `pending`.
- **Behavior**:
  1. On rejection, the timeline moves backward: "Generating" becomes `active`, and "Reviewing" and "Awaiting Approval" revert to `pending`.
  2. "Planning" remains `completed` — it is never reverted.
  3. The transition is visually smooth — the user sees the timeline "rewind" to Generating.
  4. The rejection loop can occur any number of times. Each loop follows the same pattern: Generating → Reviewing → Awaiting Approval, then potentially back to Generating again.
  5. There is no visual accumulator for rejection count on the timeline itself (rejection count is tracked in observability metrics, not displayed on the timeline).
- **Error handling**: If a rejection event is received when the timeline is not in "Awaiting Approval", the event is ignored and logged as a warning.
- **Acceptance criteria**:
  - Given the user rejects at the approval gate, when the rejection event is processed, then "Generating" becomes active, and "Reviewing" and "Awaiting Approval" revert to pending.
  - Given the user rejects multiple times, when each rejection occurs, then the timeline correctly loops back to Generating each time.
  - Given a rejection occurs, when the timeline updates, then "Planning" remains completed.

### FR-6: Localization Skip — Timeline Advances Directly to Complete

- **Description**: When the user skips localization, the "Localizing" stage is skipped/greyed out and the timeline advances directly to "Complete".
- **Input**: A localization-skip event from the workflow.
- **Output**: "Localizing" is displayed as skipped (greyed out or with a skip indicator), and "Complete" becomes active then completed.
- **Behavior**:
  1. When the user elects to skip localization (selects zero markets), the workflow fires a localization-skip event.
  2. The "Localizing" stage is shown in a `skipped` visual state — visually distinct from `pending`, `active`, and `completed`. For example: greyed out, with a skip icon, or with strikethrough text.
  3. The timeline advances directly from "Awaiting Approval" (completed) to "Complete" (active, then completed).
  4. The `skipped` state is a fourth visual state for timeline stages, applicable only to "Localizing" in this workflow.
  5. If localization is not skipped (user selects one or more markets), the "Localizing" stage follows the normal active → completed flow.
- **Error handling**: If a skip event is received for a stage other than "Localizing", it is ignored and logged.
- **Acceptance criteria**:
  - Given the user skips localization, when the timeline updates, then "Localizing" appears greyed out/skipped and "Complete" is marked as active or completed.
  - Given the user selects at least one market, when the timeline updates, then "Localizing" follows the normal active → completed flow (not skipped).

### FR-7: Timeline Lifecycle — Start and End

- **Description**: The timeline begins when the campaign pipeline starts and completes when the pipeline finishes.
- **Input**: Campaign start event (user submits a brief); campaign complete event (workflow finishes).
- **Output**: Timeline transitions from idle → active stages → all complete.
- **Behavior**:
  1. Before the user submits a brief, all stages are `pending` (idle state).
  2. When the user submits a campaign brief and the Planner agent starts, the "Planning" stage becomes `active`. This is the timeline start.
  3. When the final stage completes (either "Localizing" finishes or localization is skipped and "Complete" is reached), all stages are in `completed` or `skipped` state. This is the timeline end.
  4. When the user starts a "New Campaign" (via the New Campaign button on the completion summary card), all stages reset to `pending`.
- **Error handling**: If a start event is received while a campaign is already active, the timeline resets to idle first, then begins the new campaign (consistent with the "abandon current campaign" confirmation flow).
- **Acceptance criteria**:
  - Given no campaign is active, when the page loads, then all stages are pending.
  - Given the user submits a brief, when the Planner starts, then "Planning" becomes active.
  - Given the full workflow completes, when the user views the timeline, then all stages show completed (or skipped for Localizing if applicable).
  - Given the user clicks "New Campaign", when the timeline resets, then all stages return to pending.

## 4. Data Model

The timeline state is derived from the backend workflow state. The frontend maintains a local representation for rendering.

```typescript
/** The six campaign stages in pipeline order */
type CampaignStage =
  | 'planning'
  | 'generating'
  | 'reviewing'
  | 'awaiting-approval'
  | 'localizing'
  | 'complete';

/** Visual state of a single timeline stage */
type StageStatus = 'pending' | 'active' | 'completed' | 'skipped';

/** A single stage entry in the timeline */
interface TimelineStageEntry {
  /** The stage identifier */
  stage: CampaignStage;
  /** Display label for the stage */
  label: string;
  /** Current visual state */
  status: StageStatus;
}

/** The full timeline state */
interface TimelineState {
  /** Ordered array of stage entries */
  stages: TimelineStageEntry[];
  /** The currently active stage, or null if idle/complete */
  activeStage: CampaignStage | null;
}

/** Event pushed from backend to update timeline */
interface TimelineUpdateEvent {
  /** The stage transitioning */
  stage: CampaignStage;
  /** The new status for this stage */
  status: StageStatus;
  /** ISO timestamp of the transition */
  timestamp: string;
}
```

### WorkflowStatus → Timeline Stage Mapping

The frontend derives `TimelineState` from the backend `WorkflowStatus` value using the following mapping. Each cell shows the `StageStatus` for that timeline stage.

| WorkflowStatus        | Planning  | Generating | Reviewing | Awaiting Approval | Localizing | Complete |
|-----------------------|-----------|------------|-----------|-------------------|------------|----------|
| planning              | active    | pending    | pending   | pending           | pending    | pending  |
| plan-complete         | completed | pending    | pending   | pending           | pending    | pending  |
| generating            | completed | active     | pending   | pending           | pending    | pending  |
| creative-complete     | completed | completed  | pending   | pending           | pending    | pending  |
| reviewing             | completed | completed  | active    | pending           | pending    | pending  |
| review-complete       | completed | completed  | completed | pending           | pending    | pending  |
| awaiting-approval     | completed | completed  | completed | active            | pending    | pending  |
| approved              | completed | completed  | completed | completed         | pending    | pending  |
| rejected              | completed | active     | pending   | pending           | pending    | pending  |
| localizing            | completed | completed  | completed | completed         | active     | pending  |
| localization-complete | completed | completed  | completed | completed         | completed  | pending  |
| complete              | completed | completed  | completed | completed         | completed* | completed|
| planning-error        | error     | pending    | pending   | pending           | pending    | pending  |
| creative-error        | completed | error      | pending   | pending           | pending    | pending  |
| review-error          | completed | completed  | error     | pending           | pending    | pending  |
| localization-error    | completed | completed  | completed | completed         | error      | pending  |

*When `WorkflowStatus` is `complete` and `selectedMarkets` is empty or undefined, the Localizing stage displays as `skipped`. Otherwise it displays as `completed`.

## 5. API Contracts

The timeline is driven by backend workflow state. The following interfaces describe how the frontend receives timeline updates.

### Event: Stage Transition (Push)

Stage transitions are pushed from the backend as `stage-transition` events on the SSE stream defined in frd-chat-interface.md (`GET /api/campaign/{campaignId}/stream`, event type: `stage-transition`).

- **Source**: Backend workflow engine
- **Consumer**: Frontend timeline component
- **Payload**: `TimelineUpdateEvent` (see Data Model)
- **Trigger**: An agent starts or completes; a rejection occurs; localization is skipped.

### GET `/api/campaigns/current/timeline`

Retrieve the current timeline state (used on page load/refresh to restore state).

- **Method**: `GET`
- **Path**: `/api/campaigns/current/timeline`
- **Response 200**:
  ```json
  {
    "stages": [
      { "stage": "planning", "label": "Planning", "status": "completed" },
      { "stage": "generating", "label": "Generating", "status": "active" },
      { "stage": "reviewing", "label": "Reviewing", "status": "pending" },
      { "stage": "awaiting-approval", "label": "Awaiting Approval", "status": "pending" },
      { "stage": "localizing", "label": "Localizing", "status": "pending" },
      { "stage": "complete", "label": "Complete", "status": "pending" }
    ],
    "activeStage": "generating"
  }
  ```
- **Response 404**: No active campaign — returns `{ "error": "No active campaign" }`.
- **Response 500**: Server error — returns `{ "error": "Internal server error", "details": "..." }`.

## 6. UI/UX Requirements

### Layout
- The timeline occupies the **right panel** of the split-panel layout, adjacent to the chat panel on the left.
- The timeline is vertically oriented, with stages listed top-to-bottom in pipeline order.
- The timeline panel is always visible when a campaign is active.

### Visual States
Four distinct visual treatments are required:

| State | Visual Treatment |
|-------|-----------------|
| `pending` | Muted/grey icon and text. Unfilled or outline-only indicator. |
| `active` | Highlighted color (e.g., blue or brand accent). Optionally pulsing or animated to indicate progress. Bold or emphasized label text. |
| `completed` | Success color (e.g., green). Filled checkmark icon. Normal-weight label text. |
| `skipped` | Greyed out with a skip indicator (e.g., dash icon or strikethrough text). Visually distinct from `pending`. |

### Transitions
- Stage transitions are animated (smooth color/icon change, not a hard swap).
- On rejection loop, the "rewind" from Awaiting Approval back to Generating is visually smooth (stages animate back to pending in sequence).

### Responsive Behavior
- On narrow viewports, the timeline may collapse to a horizontal compact bar or a minimal indicator (e.g., "Stage 2/6: Generating").
- The chat panel always takes priority for space; the timeline is secondary.

### Accessibility
- Each stage has an `aria-label` describing its name and current state (e.g., "Planning: completed").
- Active stage is announced to screen readers when it changes.
- Color is not the sole differentiator — icons or text indicators supplement color for each state.

## 7. Dependencies

| Dependency | Direction | Description |
|------------|-----------|-------------|
| `chat-interface` | Sibling | Timeline is displayed alongside the chat in the split-panel layout. Layout coordination required. |
| `campaign-planning` | Upstream | Planning agent start/completion triggers "Planning" stage transitions. |
| `creative-generation` | Upstream | Creative Generator start/completion triggers "Generating" stage transitions. |
| `copy-review` | Upstream | Copy Reviewer start/completion triggers "Reviewing" stage transitions. |
| `human-approval` | Upstream | Approval gate activation triggers "Awaiting Approval" active state. Rejection triggers rewind. Approval triggers advance. |
| `localization` | Upstream | Localizer start/completion triggers "Localizing" stage transitions. Skip triggers `skipped` state. |
| `data-persistence` | Upstream | Timeline state must be restorable on page refresh (persisted as part of campaign state). |

## 8. Acceptance Criteria Summary

1. All six stages (Planning, Generating, Reviewing, Awaiting Approval, Localizing, Complete) are displayed in the right panel in correct order.
2. The active stage is visually distinct from completed and pending stages using color, icons, and/or text emphasis.
3. Completed stages display a success indicator (e.g., checkmark) clearly different from pending and active states.
4. The timeline updates in real time as agents start and complete — no page refresh required.
5. On rejection at the approval gate, the timeline moves back to "Generating" as active; "Reviewing" and "Awaiting Approval" revert to pending; "Planning" remains completed.
6. Multiple consecutive rejection loops are supported, each correctly reflected in the timeline.
7. When localization is skipped, "Localizing" is displayed as skipped/greyed out and the timeline advances directly to "Complete".
8. When localization is not skipped, "Localizing" follows the normal active → completed flow.
9. On initial page load with no active campaign, all stages are pending.
10. On page refresh during an active campaign, the timeline restores to the correct state (via persisted data).
11. On "New Campaign", all stages reset to pending.
12. Stage transitions are driven by backend workflow state events, not frontend timers.
13. The timeline is accessible — states are communicated via `aria-label` and not solely through color.
