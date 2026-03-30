# FRD: Human Approval Gate

**Feature ID**: `human-approval`
**PRD Reference**: §4.5 Human Approval Gate
**Status**: Draft

## 1. Overview

The Human Approval Gate is the critical human-in-the-loop checkpoint in the campaign pipeline. After the Copy Reviewer completes, the workflow fully pauses and presents the complete creative package — image, caption, hashtags, and review report — for human review. The user must explicitly approve or reject the creative. Rejection requires written feedback and a scope selection, triggering a loop back to the Creative Generator. Approval advances the workflow to market selection and localization. This gate ensures no AI-generated content proceeds without explicit human authorization.

## 2. User Stories

- **US-7**: As a campaign creator, I want the workflow to pause at a human approval gate showing the image, caption, hashtags, and review report so that I make the final decision on creative quality.
- **US-8**: As a campaign creator, I want to reject creative assets with written feedback so that the Creative Generator can incorporate my notes and produce improved output.
- **US-9**: As a campaign creator, I want the rejection loop to return to the Creative Generator (not the Planner) so that the strategy is preserved while only the creative is reworked.
- **US-10**: As a campaign creator, I want to be able to reject and loop as many times as needed so that I'm never forced to accept unsatisfactory output.
- **US-23**: As a campaign creator, I want to choose between regenerating just the text or the full creative (including image) when rejecting so that I don't wait for a new image when only the copy needs work.

## 3. Functional Requirements

### FR-1: Workflow Pause

- **Description**: The pipeline fully halts at the approval gate. No downstream agent runs until the user takes an explicit action.
- **Input**: Completion signal from Copy Reviewer agent, full creative context.
- **Output**: Workflow state set to `awaiting-approval`, UI controls rendered.
- **Behavior**:
  1. When the Copy Reviewer completes and hands off, the workflow state transitions to `awaiting-approval`.
  2. No downstream agent (Localizer) is invoked until the user explicitly approves.
  3. No timeout triggers auto-approval or auto-rejection — the workflow waits indefinitely.
  4. The campaign timeline updates to show "Awaiting Approval" as the active stage.
  5. The workflow remains paused across page refreshes — restoring from persistence returns to the approval gate.
- **Error handling**: If the state transition fails, the system retries. If the creative context is incomplete (e.g., missing image URL), an error is displayed and the user is prompted to retry from the Copy Reviewer.
- **Acceptance criteria**:
  - Given the Copy Reviewer has completed, When the approval gate activates, Then no downstream agent runs.
  - Given the workflow is paused at the approval gate, When the user does nothing, Then the workflow remains paused indefinitely.
  - Given a page refresh while at the approval gate, When the page reloads, Then the approval gate is restored with all creative assets visible.

### FR-2: Creative Package Display

- **Description**: The approval gate displays the complete creative package for human review.
- **Input**: AI-generated image (URL), caption (string), hashtags (string[]), copy review report (`CopyReviewReport`).
- **Output**: Rendered inline UI in the chat showing all elements.
- **Behavior**:
  1. The AI-generated image is displayed at a reasonable preview size (not thumbnail, not full-resolution).
  2. The caption text is displayed below the image, clearly formatted.
  3. Hashtags are displayed as a list or inline group below the caption.
  4. The copy review report is displayed with verdict and findings (same format as the Copy Reviewer output).
  5. All four elements (image, caption, hashtags, report) are visible together without scrolling if possible, or in a logical scroll order.
  6. The display is read-only — the user cannot edit the caption or hashtags inline at this stage.
- **Error handling**: If the image fails to load (broken URL), display a placeholder with an error message. The rest of the approval gate still functions.
- **Acceptance criteria**:
  - Given a complete creative package, When the approval gate renders, Then the image, caption, hashtags, and review report are all visible.
  - Given a broken image URL, When the approval gate renders, Then a placeholder is shown and approve/reject buttons still function.

### FR-3: Flag Verdict Warning Banner

- **Description**: When the copy review verdict is "flag", a prominent warning banner is displayed at the approval gate.
- **Input**: `CopyReviewReport` with `verdict: "flag"`.
- **Output**: Warning banner UI element.
- **Behavior**:
  1. If the review verdict is `"flag"`, a warning banner is rendered prominently above or near the approve/reject controls.
  2. The banner highlights the flagged issues — it summarizes the `warning` and `critical` findings from the report.
  3. The banner does NOT prevent approval. The user can still approve despite flags (informed override).
  4. The banner uses a visually distinct style (yellow/orange background, warning icon) to draw attention.
  5. If the verdict is `"pass"`, no warning banner is displayed.
- **Error handling**: None — this is a pure UI rendering based on the verdict value.
- **Acceptance criteria**:
  - Given a review verdict of `"flag"`, When the approval gate renders, Then a warning banner is visible highlighting flagged issues.
  - Given a review verdict of `"pass"`, When the approval gate renders, Then no warning banner is displayed.
  - Given a warning banner is displayed, When the user clicks approve, Then the approval proceeds (informed override).

### FR-4: Approve Action

- **Description**: The user approves the creative package, advancing the workflow to market selection and localization.
- **Input**: User clicks the "Approve" button.
- **Output**: Workflow state transitions to market selection (localization prompt).
- **Behavior**:
  1. An "Approve" button is rendered as part of the approval gate UI.
  2. The approve button is always enabled (regardless of flag verdict).
  3. Clicking approve transitions the workflow state from `awaiting-approval` to `localizing` (market selection prompt).
  4. The approved creative package (image, caption, hashtags) is persisted as the final approved version.
  5. The campaign timeline updates: "Awaiting Approval" completes, workflow advances.
  6. The approval action is logged for observability (timestamp, iteration number).
  7. Once approved, the approval gate UI becomes non-interactive (buttons disabled/removed) to prevent double-submission.
- **Error handling**: If the state transition fails after approval, the system retries. The UI shows a loading state during transition. If retries fail, an error message is shown and the user can try approving again.
- **Acceptance criteria**:
  - Given the approval gate is active, When the user clicks "Approve", Then the workflow advances to market selection.
  - Given the user has approved, When the transition completes, Then the approve/reject buttons become non-interactive.
  - Given a flag verdict, When the user clicks "Approve", Then the workflow still advances (informed override).

### FR-5: Reject with Required Feedback

- **Description**: The user rejects the creative and must provide written feedback explaining what to improve.
- **Input**: User clicks "Reject" after entering feedback text.
- **Output**: Rejection event with feedback text and scope selection.
- **Behavior**:
  1. A text input field for feedback is rendered as part of the approval gate UI.
  2. The "Reject" action is not a single button — it is gated by non-empty feedback text.
  3. When the feedback input is empty (or contains only whitespace), the rejection buttons are disabled (greyed out, non-clickable).
  4. When the user enters non-empty, non-whitespace feedback, the rejection buttons become enabled.
  5. The feedback field has no maximum length limit but is a reasonably-sized text area (multi-line).
  6. Feedback is preserved if the user types but hasn't submitted yet and the page is refreshed (best effort via persistence).
- **Error handling**: None for the feedback input itself. Validation is purely UI-side (non-empty check).
- **Acceptance criteria**:
  - Given the feedback field is empty, When the user views the rejection controls, Then the reject buttons are disabled.
  - Given the user enters whitespace-only text, When the validation runs, Then the reject buttons remain disabled.
  - Given the user enters "Make the tone more playful", When the validation runs, Then the reject buttons become enabled.

### FR-6: Rejection Scope Selection

- **Description**: On rejection, the user selects the scope of regeneration — full creative or text-only.
- **Input**: User selects a rejection scope option.
- **Output**: Scope value (`"regenerate-all"` | `"keep-image-redo-text"`) attached to the rejection event.
- **Behavior**:
  1. Two distinct rejection actions are presented as separate buttons or clearly labeled options:
     - **"Regenerate All"** — regenerates image, caption, and hashtags. Use when the visual direction is wrong.
     - **"Keep Image, Redo Text"** — preserves the current image and regenerates only caption and hashtags. Use when the image is good but copy needs work.
  2. Both buttons/options are disabled when feedback is empty (same gate as FR-5).
  3. Both buttons/options become enabled when valid feedback is entered.
  4. Clicking either option triggers the rejection with the corresponding scope.
  5. The scope is passed to the Creative Generator along with the feedback text.
- **Error handling**: If the rejection event fails to dispatch, the UI shows an error and the buttons remain clickable for retry.
- **Acceptance criteria**:
  - Given valid feedback is entered, When the user clicks "Regenerate All", Then a rejection with scope `"regenerate-all"` and the feedback is dispatched.
  - Given valid feedback is entered, When the user clicks "Keep Image, Redo Text", Then a rejection with scope `"keep-image-redo-text"` and the feedback is dispatched.
  - Given no feedback is entered, When the user views both rejection options, Then both are disabled.

### FR-7: Rejection Loop to Creative Generator

- **Description**: On rejection, the workflow loops back to the Creative Generator (not the Campaign Planner), preserving the original plan.
- **Input**: Rejection event with feedback, scope, and current iteration context.
- **Output**: Creative Generator re-invoked with feedback, scope, and preserved plan.
- **Behavior**:
  1. The rejection event triggers a state transition from `awaiting-approval` back to `generating`.
  2. The Creative Generator receives:
     - The original campaign plan (unchanged from the Planner).
     - The rejection feedback text.
     - The rejection scope (`"regenerate-all"` or `"keep-image-redo-text"`).
     - The current iteration number (for tracking).
     - If scope is `"keep-image-redo-text"`, the current image URL (to preserve).
  3. The Campaign Planner is NOT re-invoked. The plan is stable across all rejection loops.
  4. The campaign timeline updates: "Awaiting Approval" resets, "Generating" becomes active again.
  5. After the Creative Generator produces new output, the pipeline proceeds through Copy Reviewer → Human Approval again (full review cycle on each iteration).
- **Error handling**: If the loop-back transition fails, the system retries. If it cannot transition, an error message is shown and the user can retry the rejection.
- **Acceptance criteria**:
  - Given a rejection, When the loop occurs, Then the Creative Generator is invoked (not the Campaign Planner).
  - Given a rejection with scope `"keep-image-redo-text"`, When the Creative Generator runs, Then the same image is preserved and only caption/hashtags change.
  - Given a rejection with scope `"regenerate-all"`, When the Creative Generator runs, Then a new image, caption, and hashtags are all generated.
  - Given a rejection, When the timeline updates, Then it shows "Generating" as active.

### FR-8: Unlimited Rejection Iterations

- **Description**: There is no maximum number of rejection loops. The user can reject as many times as needed.
- **Input**: Any number of sequential rejections.
- **Output**: Each rejection produces a new creative iteration.
- **Behavior**:
  1. No counter or limit caps the number of rejections.
  2. Each rejection-regeneration cycle produces a new iteration (v1, v2, v3, …).
  3. The iteration number increments monotonically.
  4. System performance should not degrade significantly across many iterations (state does not accumulate unboundedly in memory — only the current iteration's assets are active, though history is preserved in chat).
- **Error handling**: None specific — each individual rejection uses the same retry logic as FR-7.
- **Acceptance criteria**:
  - Given the user has rejected 5 times, When they reject a 6th time, Then the rejection proceeds normally.
  - Given multiple rejections, When iteration numbers are displayed, Then they increment sequentially (v1, v2, v3, …).

### FR-9: Iteration History Visibility

- **Description**: Previous creative iterations remain visible in the chat history, each numbered sequentially.
- **Input**: Multiple creative iterations from rejection loops.
- **Output**: Numbered iteration labels in the chat history.
- **Behavior**:
  1. Each creative output (image, caption, hashtags) from the Creative Generator is labeled with an iteration number: "Creative v1", "Creative v2", "Creative v3", etc.
  2. Previous iterations remain in the scrollable chat history — they are not removed or collapsed.
  3. The corresponding review report for each iteration is also preserved in the history.
  4. The approval gate always shows the latest iteration's assets.
  5. The first iteration is labeled "Creative v1" (1-indexed, not 0-indexed).
  6. The iteration label is displayed as a heading or badge above the creative output in the chat.
- **Error handling**: None — iteration numbering is a sequential counter maintained in state.
- **Acceptance criteria**:
  - Given one creative generation with no rejections, When displayed, Then it is labeled "Creative v1".
  - Given two rejections and three total iterations, When scrolling the chat, Then "Creative v1", "Creative v2", and "Creative v3" are all visible.
  - Given three iterations, When the approval gate is active, Then it shows the v3 creative assets.

### FR-10: Post-Approval Transition to Market Selection

- **Description**: After approval, the workflow transitions to the localization market selection prompt.
- **Input**: Approved creative package.
- **Output**: Market selection UI prompt in the chat.
- **Behavior**:
  1. Immediately after approval, the Localizer agent is invoked.
  2. The Localizer's first action is to present the market selection prompt (see `frd-localization.md`).
  3. The approval gate UI becomes non-interactive (buttons disabled/hidden).
  4. The approved creative assets are passed to the Localizer as input.
  5. The transition is seamless — no intermediate loading state visible to the user beyond normal agent startup.
- **Error handling**: If the Localizer fails to start, an error message with a retry button is shown.
- **Acceptance criteria**:
  - Given the user clicks "Approve", When the transition completes, Then the market selection prompt appears in the chat.
  - Given the user approved, When the approval gate is revisited (scroll up), Then the buttons are non-interactive.

## 4. Data Model

```typescript
/** Scope of a creative rejection */
type RejectionScope = "regenerate-all" | "keep-image-redo-text";

/** Approval gate state */
type ApprovalStatus = "pending" | "approved" | "rejected";

/** A single creative iteration */
interface CreativeIteration {
  /** 1-based iteration number */
  iterationNumber: number;
  /** URL of the generated image */
  imageUrl: string;
  /** Instagram caption */
  caption: string;
  /** Hashtags */
  hashtags: string[];
  /** Copy review report for this iteration */
  reviewReport: CopyReviewReport;
  /** Timestamp of generation */
  createdAt: string;
}

/** Rejection event data */
interface RejectionEvent {
  /** Written feedback from the user */
  feedback: string;
  /** Scope of regeneration */
  scope: RejectionScope;
  /** Which iteration was rejected */
  iterationNumber: number;
  /** Timestamp of rejection */
  rejectedAt: string;
}

/** Approval event data */
interface ApprovalEvent {
  /** Which iteration was approved */
  iterationNumber: number;
  /** Whether the review had flags (informed override) */
  hadFlags: boolean;
  /** Timestamp of approval */
  approvedAt: string;
}

/** Full approval gate state */
interface ApprovalGateState {
  /** Current status */
  status: ApprovalStatus;
  /** All creative iterations (history) */
  iterations: CreativeIteration[];
  /** Current (latest) iteration number */
  currentIteration: number;
  /** Rejection history */
  rejections: RejectionEvent[];
  /** Approval event (set when approved) */
  approval: ApprovalEvent | null;
}
```

## 5. API Contracts

### Agent State (Internal — LangGraph State)

The Human Approval Gate is a LangGraph interrupt node that pauses the graph and waits for user input.

**Pause State:**
```
LangGraph interrupt
State fields available:
  - approvalGateState: ApprovalGateState
  - campaignPlan: CampaignPlan
  - currentCreative: CreativeIteration
```

**Resume — Approve:**
```
User action: approve
Input: none (button click)
Output state:
  - approvalGateState.status: "approved"
  - approvalGateState.approval: ApprovalEvent
  - nextAgent: "localization"
```

**Resume — Reject:**
```
User action: reject
Input:
  - feedback: string (non-empty)
  - scope: RejectionScope
Output state:
  - approvalGateState.status: "rejected"
  - approvalGateState.rejections: [..., new RejectionEvent]
  - nextAgent: "creative-generation"
  - rejectionFeedback: string
  - rejectionScope: RejectionScope
```

## 6. UI/UX Requirements

### Layout
- The approval gate renders inline in the chat panel as a structured card/block.
- The card contains: image preview, caption text, hashtags, review report summary, and action controls.

### Image Preview
- The AI-generated image is displayed at a reasonable preview size.
- Clicking the image could open a larger view (nice-to-have, not required).

### Review Report Section
- Verdict badge: ✅ Pass (green) or ⚠️ Flagged (yellow/orange).
- Findings listed with type and severity indicators.

### Warning Banner (Flag Verdict)
- Displayed prominently when verdict is `"flag"`.
- Yellow/orange background with ⚠️ icon.
- Lists the `warning` and `critical` findings in summary form.
- Does NOT block approval.

### Action Controls
- **Approve button**: Always enabled. Primary style (e.g., green/blue). Labeled "Approve".
- **Feedback text area**: Multi-line input. Placeholder text: "What should be changed?"
- **Reject buttons** (two):
  - "Regenerate All" — secondary/destructive style. Disabled when feedback is empty.
  - "Keep Image, Redo Text" — secondary style. Disabled when feedback is empty.
- Disabled state is visually clear (greyed out, no hover effect).

### Iteration Labels
- Each creative output block in chat history has a header: "Creative v{N}" where N is the iteration number.
- The label uses a distinct style (bold, badge, or heading).

### Post-Action State
- After approval or rejection, the action controls become non-interactive (disabled or hidden).
- A status message replaces the controls: "✅ Approved" or "🔄 Rejected — regenerating…"

## 7. Dependencies

- **Copy Review (`copy-review`)**: Provides the review report that triggers the approval gate and determines whether a warning banner is shown.
- **Creative Generation (`creative-generation`)**: Provides the creative assets (image, caption, hashtags) displayed at the gate. Receives rejection events with feedback and scope.
- **Localization (`localization`)**: Receives the approved creative package and begins market selection.
- **Chat Interface (`chat-interface`)**: Renders the approval gate UI inline in the chat.
- **Campaign Timeline (`campaign-timeline`)**: Reflects the "Awaiting Approval" stage and rejection loops.
- **Data Persistence (`data-persistence`)**: Persists approval gate state so it survives page refresh.

## 8. Acceptance Criteria Summary

| ID | Criterion |
|----|-----------|
| AC-1 | The workflow fully pauses — no downstream agent runs until the user acts. |
| AC-2 | The image, caption, hashtags, and review report are all visible at the approval gate. |
| AC-3 | A warning banner is displayed when the review verdict is `"flag"`, highlighting flagged issues. |
| AC-4 | The user can approve despite flags (informed override). |
| AC-5 | The reject buttons are disabled until non-empty, non-whitespace feedback text is entered. |
| AC-6 | Two rejection scope options are available: "Regenerate All" and "Keep Image, Redo Text". |
| AC-7 | Approve advances the workflow to market selection / localization. |
| AC-8 | Reject with feedback and selected scope loops back to the Creative Generator (not the Campaign Planner). |
| AC-9 | Rejection with scope `"keep-image-redo-text"` preserves the current image. |
| AC-10 | Rejection with scope `"regenerate-all"` produces a new image, caption, and hashtags. |
| AC-11 | Multiple consecutive rejections are supported with no maximum. |
| AC-12 | Previous creative iterations are visible in chat history, each labeled "Creative v{N}". |
| AC-13 | The approval gate state persists across page refresh. |
| AC-14 | After approval, the approval gate UI becomes non-interactive. |
| AC-15 | After rejection, the approval gate UI becomes non-interactive and the timeline shows "Generating". |
| AC-16 | The first iteration is labeled "Creative v1" (1-indexed). |
