# Product Requirements Document: AI Marketing Campaign Assistant

## 1. Product Vision

The AI Marketing Campaign Assistant is a single-user demo application that showcases multi-agent AI orchestration with human-in-the-loop approval. A user describes a marketing campaign in plain English via a chat interface, and a pipeline of four specialized AI agents collaboratively produces a complete, localized marketing campaign — including strategy, AI-generated creative imagery, copy review, and multi-market localization — with a mandatory human approval gate before finalization.

The product demonstrates how autonomous AI agents can be chained in a structured workflow while keeping humans in control of critical decisions.

## 2. Target Users / Personas

### Demo Audience
- **Technical evaluators** — developers, architects, and engineering leaders evaluating multi-agent AI orchestration patterns, LangGraph workflows, and human-in-the-loop designs.
- **Product stakeholders** — product managers and marketers who want to see how AI agents can automate campaign creation while preserving human oversight.

### Primary Persona: Campaign Creator
A single user interacting with the chat interface to create a marketing campaign. No authentication is required. The user provides a campaign brief in natural language, reviews AI-generated outputs, approves or rejects creative assets with feedback, selects target markets for localization, and observes the full agent pipeline via a visual timeline.

## 3. User Stories

1. As a campaign creator, I want to describe a marketing campaign in plain English so that I don't need to fill out structured forms.
2. As a campaign creator, I want the Campaign Planner agent to turn my brief into a structured strategy so that I can see a clear plan before creative work begins.
3. As a campaign creator, I want smart defaults filled in when my brief is vague so that the workflow proceeds without forcing me to specify every detail.
4. As a campaign creator, I want the structured plan displayed as formatted markdown in the chat so that I can read it clearly.
5. As a campaign creator, I want the Creative Generator agent to produce an AI-generated image and Instagram-optimized caption with hashtags so that I get real creative assets, not placeholders.
6. As a campaign creator, I want the Copy Reviewer agent to check the caption and hashtags against the campaign's brand tone and flag potential legal issues so that I can trust the output before publishing.
7. As a campaign creator, I want the workflow to pause at a human approval gate showing the image, caption, hashtags, and review report so that I make the final decision on creative quality.
8. As a campaign creator, I want to reject creative assets with written feedback so that the Creative Generator can incorporate my notes and produce improved output.
9. As a campaign creator, I want the rejection loop to return to the Creative Generator (not the Planner) so that the strategy is preserved while only the creative is reworked.
10. As a campaign creator, I want to be able to reject and loop as many times as needed so that I'm never forced to accept unsatisfactory output.
11. As a campaign creator, I want to select which markets to localize into after approving the creative so that I control where the campaign targets.
12. As a campaign creator, I want to pick any combination of the five supported markets (Spain, France, Germany, Brazil, Japan), say "all," or skip localization entirely so that I have full flexibility.
13. As a campaign creator, I want translations to preserve marketing tone and cultural nuance so that localized content feels native to each market.
14. As a campaign creator, I want the original English content kept alongside translations so that I can compare them.
15. As a campaign creator, I want to see a visual timeline on the right panel showing campaign stages so that I always know where the workflow is.
16. As a campaign creator, I want token-by-token streaming of agent responses in the chat so that I see output progressively rather than waiting for a complete response.
17. As a campaign creator, I want status messages during image generation so that I know the system is working during the wait (up to a minute).
18. As a campaign creator, I want all campaign data persisted at each stage so that nothing is lost if I refresh the page.
19. As a campaign creator, I want to resume my campaign from the last completed stage after a page refresh so that I don't lose progress.
20. As a campaign creator, I want the system to automatically retry failed AI calls so that transient errors don't disrupt my workflow.
21. As a campaign creator, I want to see an error message and retry button when AI calls fail after automatic retries so that I can decide whether to try again.
22. As a campaign creator, I want a warning before my current campaign is abandoned so that I don't accidentally lose progress.
23. As a campaign creator, I want to choose between regenerating just the text or the full creative (including image) when rejecting so that I don't wait for a new image when only the copy needs work.
24. As a campaign creator, I want a completion summary card showing all campaign results so that I can review the final output in one place.

## 4. Feature Areas

### 4.1 Chat Interface & Streaming

- **ID**: `chat-interface`
- **Name**: Chat Interface & Streaming
- **Description**: A split-panel layout with a chat panel on the left for user input and agent responses, supporting token-by-token streaming of all agent outputs.
- **Key behaviors**:
  - Split-panel layout: chat panel on the left, visual timeline on the right.
  - User submits a campaign brief as a free-text chat message.
  - Agent responses stream token-by-token into the chat as formatted markdown.
  - Status messages are displayed during long-running operations (e.g., image generation, which can take up to a minute).
  - The chat displays structured plan output, creative assets (image, caption, hashtags), review reports, approval prompts, and localization results.
  - The approval gate renders inline UI controls (approve/reject buttons, feedback text input) within the chat flow.
  - Market selection for localization is presented as an interactive prompt within the chat.
  - Text-generating agents (Planner, Copy Reviewer, Localizer) stream token-by-token. Image generation does NOT stream — status/progress messages appear in chat instead.
  - Structured data (plan schema, review verdict, localization results) arrives atomically after streaming explanation text.
  - The timeline updates when an agent *starts* (stage becomes active) and when it *completes* (stage becomes complete).
  - When an AI service call fails, the system automatically retries up to 3 attempts. If all retries fail, an error message is displayed in the chat with a manual retry button. This applies to all agent steps (planning, creative generation, copy review, localization).
  - If the user submits a new brief while a campaign pipeline is active, a warning is shown that the current campaign will be abandoned. The user must confirm before the new campaign starts.
- **Acceptance criteria**:
  - User can type and submit a campaign brief in the chat.
  - All text-generating agent responses stream token-by-token (not delivered as a single block).
  - Image generation shows status/progress messages (not streaming).
  - Structured data (plan, review verdict, localization results) is delivered atomically after any streaming explanation text.
  - Status/progress messages appear during image generation.
  - The layout renders a left chat panel and a right timeline panel.
  - Approval gate UI (image preview, approve/reject, feedback input) renders inline in the chat.
  - Market selection UI renders inline in the chat.
  - AI service failures trigger automatic retry (up to 3 attempts), then display an error message with a manual retry button.
  - A warning and confirmation prompt appear when a new brief is submitted during an active pipeline.

### 4.2 Campaign Planning (Agent 1)

- **ID**: `campaign-planning`
- **Name**: Campaign Planning Agent
- **Description**: The first agent in the pipeline. Takes the user's plain-English brief and produces a structured campaign strategy.
- **Key behaviors**:
  - Accepts a free-text campaign brief from the user.
  - If the brief is empty or too short (fewer than 10 characters), the system prompts the user to provide more detail. The Planner does NOT attempt to generate a plan from an empty input.
  - Maximum brief length is 2000 characters. Input exceeding this is truncated with a notification to the user.
  - Produces a structured plan with the following schema:
    - `campaignName` (string, required) — generated campaign name.
    - `objective` (string, required) — campaign objective.
    - `targetAudience` (string, required, default: "General audience") — target audience.
    - `keyMessages` (string[], required) — 2–5 key messages.
    - `visualDirection` (string, required) — description of visual style/mood.
    - `tone` (string, required, default: "Professional") — brand voice tone.
    - `platform` (string, required, default: "Instagram") — target platform.
  - Fills in smart defaults when the brief is vague:
    - Platform defaults to Instagram.
    - Audience defaults to "General audience."
    - Tone defaults to "Professional."
  - Outputs the plan as formatted markdown in the chat.
  - Automatically hands off to the Creative Generator agent upon completion (no user action required).
- **Acceptance criteria**:
  - A brief like "Launch a summer fitness campaign" produces a complete plan with all schema fields populated.
  - Missing platform, audience, and tone fields are filled with the specified defaults.
  - The plan is rendered as formatted markdown in the chat.
  - Handoff to Creative Generator happens automatically after the plan is displayed.
  - A brief shorter than 10 characters is rejected with a prompt for more detail.
  - A brief longer than 2000 characters is truncated and the user is notified.

### 4.3 Creative Generation (Agent 2)

- **ID**: `creative-generation`
- **Name**: Creative Generator Agent
- **Description**: The second agent in the pipeline. Produces actual creative assets based on the campaign plan — a real AI-generated image, an Instagram-optimized caption, and hashtags.
- **Key behaviors**:
  - Receives the structured campaign plan from the Campaign Planner.
  - Generates a real AI image (not a stub or placeholder) aligned with the plan's visual direction.
  - Produces an Instagram-optimized caption (100–300 characters).
  - Produces 5–10 relevant hashtags.
  - Displays status messages during image generation (which can take up to a minute).
  - On rejection with feedback, regenerates creative assets incorporating the feedback while preserving the original campaign plan. The user chooses the rejection scope: "Regenerate All" (new image + caption + hashtags) or "Keep Image, Redo Text" (preserve image, regenerate only caption + hashtags).
  - Automatically hands off to the Copy Reviewer agent upon completion.
- **Acceptance criteria**:
  - A real image is generated (binary image data, not a placeholder or URL to a stock photo).
  - The caption is between 100 and 300 characters.
  - Between 5 and 10 hashtags are generated.
  - Status messages appear in the chat while the image is being generated.
  - On rejection, the agent receives the feedback and produces new creative output (image URL differs if image was regenerated; caption text differs from previous iteration) without re-running the Campaign Planner.
  - "Keep Image, Redo Text" rejection preserves the existing image and regenerates only caption and hashtags.
  - The generated image is saved and servable via URL.

### 4.4 Copy Review (Agent 3)

- **ID**: `copy-review`
- **Name**: Copy Reviewer Agent
- **Description**: The third agent in the pipeline. Reviews the caption and hashtags for brand alignment and potential legal issues.
- **Key behaviors**:
  - Receives the caption, hashtags, and the campaign plan (for brand tone and key messages context).
  - Checks caption and hashtags against the campaign's brand tone and key messages.
  - Flags potential legal issues such as unsubstantiated claims or missing disclaimers.
  - Produces a review report with the following schema:
    - `verdict` ("pass" | "flag") — overall assessment.
    - `findings` (array of objects) — each finding contains:
      - `type` ("brand-alignment" | "legal" | "tone") — category of finding.
      - `severity` ("info" | "warning" | "critical") — severity level.
      - `detail` (string) — description of the finding.
    - A "pass" verdict can still have informational findings. A "flag" verdict means at least one warning or critical finding exists.
  - Displays the review report as formatted markdown in the chat.
  - Automatically hands off to the Human Approval Gate upon completion.
- **Acceptance criteria**:
  - A review report is produced for every creative asset.
  - The report contains a clear verdict ("pass" or "flag") following the schema above.
  - The report contains typed, severity-graded findings (not just a verdict or free text).
  - A "flag" verdict is produced when at least one finding has severity "warning" or "critical."
  - The report is displayed in the chat before the approval gate activates.

### 4.5 Human Approval Gate

- **ID**: `human-approval`
- **Name**: Human Approval Gate
- **Description**: The workflow pauses and presents the complete creative package for human review and decision.
- **Key behaviors**:
  - The workflow pauses (no automatic progression).
  - Displays the AI-generated image, caption, hashtags, and the reviewer's report together.
  - When the copy review verdict is "flag," the approval gate renders a warning banner highlighting the flagged issues. The user can still approve despite flags (informed override).
  - The user can approve the creative package.
  - The user can reject with written feedback. Rejection feedback is required — the reject button is disabled until the user enters non-empty feedback text.
  - On rejection, the user chooses the rejection scope: "Regenerate All" (new image + caption + hashtags) or "Keep Image, Redo Text" (preserve image, regenerate only caption + hashtags). Two distinct buttons/options are presented.
  - On rejection, the workflow loops back to the Creative Generator agent (not the Campaign Planner), passing the feedback and selected scope.
  - The rejection-regeneration loop can repeat as many times as needed — there is no maximum.
  - Previous creative iterations remain visible in the chat history (scrollable). Each iteration is numbered (e.g., "Creative v1", "Creative v2").
  - On approval, the workflow proceeds to the Localizer agent.
- **Acceptance criteria**:
  - The workflow fully pauses — no downstream agent runs until the user acts.
  - The image, caption, hashtags, and review report are all visible at the approval gate.
  - A warning banner is displayed when the review verdict is "flag," highlighting flagged issues.
  - The user can approve despite flags (informed override).
  - The reject button is disabled until non-empty feedback text is entered.
  - Two rejection scope options are available: "Regenerate All" and "Keep Image, Redo Text."
  - Approve advances to localization.
  - Reject with feedback and selected scope loops back to the Creative Generator.
  - The Campaign Planner is NOT re-invoked on rejection.
  - Multiple consecutive rejections are supported.
  - Previous creative iterations are visible in chat history, each numbered sequentially.

### 4.6 Localization (Agent 4)

- **ID**: `localization`
- **Name**: Localizer Agent
- **Description**: After human approval, translates and adapts the creative content for selected international markets.
- **Key behaviors**:
  - Prompts the user to select target markets after creative approval.
  - Five supported markets: Spain (Spanish), France (French), Germany (German), Brazil (Portuguese), Japan (Japanese).
  - The user can pick any combination of markets, say "all" for all five, or skip localization entirely.
  - Maximum of five markets (the five listed above).
  - Translates the caption per selected market, preserving marketing tone and cultural nuance.
  - Adapts hashtags per market (translated/localized, not just literal translation).
  - Processes selected markets in parallel.
  - The original English caption and hashtags are kept alongside the translations.
  - Displays all translations in the chat upon completion.
- **Acceptance criteria**:
  - The user is prompted to select markets after approval.
  - Any combination of the five markets can be selected.
  - "All" selects all five markets.
  - Skip produces no translations and completes the workflow.
  - Each selected market receives a translated caption and adapted hashtags.
  - Localized hashtags may differ from literal translations of the English hashtags; the caption is in the target language (detectable via language identification).
  - The original English content is preserved in the final output.
  - Localization for multiple markets runs in parallel (not sequentially).

### 4.7 Campaign Timeline / Status

- **ID**: `campaign-timeline`
- **Name**: Campaign Timeline & Status
- **Description**: A visual timeline in the right panel showing the progression through campaign stages.
- **Key behaviors**:
  - Displays in the right panel of the split-panel layout.
  - Shows the following stages in order: Planning → Generating → Reviewing → Awaiting Approval → Localizing → Complete.
  - The current active stage is visually highlighted.
  - Completed stages are visually distinguished from pending and active stages.
  - The timeline updates in real time as the workflow progresses.
  - On rejection at the approval gate, the timeline reflects the loop back to Generating.
  - When localization is skipped, the timeline advances directly from "Awaiting Approval" to "Complete" (the "Localizing" stage is skipped/greyed out).
- **Acceptance criteria**:
  - All six stages are displayed in the timeline.
  - The active stage is visually distinct from completed and pending stages.
  - The timeline updates as agents hand off to each other.
  - Rejection loops are reflected (timeline moves back to Generating).
  - When localization is skipped, the "Localizing" stage is skipped/greyed out and the timeline advances directly to "Complete."

### 4.8 Data Persistence

- **ID**: `data-persistence`
- **Name**: Data Persistence
- **Description**: All campaign data is persisted at each stage of the workflow, including generated images.
- **Key behaviors**:
  - Campaign data is persisted at each stage transition (after planning, after creative generation, after review, after approval, after localization).
  - Generated images are saved to persistent storage and served via URL.
  - On page refresh, the campaign is restored to the last completed stage. The user sees the campaign state so far and can continue from there.
  - If the database is unreachable, the system shows an error message (no silent degradation or in-memory fallback).
  - After the campaign completes, a completion summary card is displayed showing the full campaign results (image, caption, hashtags, translations, review report) with a "New Campaign" button that clears the chat for a fresh start.
- **Acceptance criteria**:
  - Campaign data is saved after each pipeline stage completes.
  - Generated images are retrievable via URL after being saved.
  - Page refresh restores the campaign to the last completed stage; the user can continue from there.
  - If the database is unreachable, an error message is displayed to the user.
  - A completion summary card showing all campaign results is displayed after the workflow finishes.
  - A "New Campaign" button is available on the summary card; clicking it clears the chat for a fresh start.

### 4.9 Observability

- **ID**: `observability`
- **Name**: Observability
- **Description**: Structured logging, distributed tracing, and metrics for monitoring the agent pipeline.
- **Key behaviors**:
  - Structured logging for all agent actions and workflow transitions.
  - Distributed tracing with individual spans for each agent invocation and each AI/LLM call.
  - The Localizer agent produces one parent span with child spans per market translation.
  - Metrics tracking:
    - Duration of each agent's execution.
    - Number of rejection loops (rejection count per campaign).
    - Number of markets selected for localization.
- **Acceptance criteria**:
  - All agent invocations produce structured log entries (not unstructured console output).
  - A distributed trace spans the full campaign lifecycle with child spans per agent and per AI call.
  - Agent duration metrics are recorded.
  - Rejection count metrics are recorded.
  - Market count metrics are recorded.

## 5. Non-Goals (Explicit Exclusions)

- **No authentication or authorization.** The app is a single-user demo with no login, sessions, or user management.
- **No rate limiting.** There is no throttling of requests or AI API calls.
- **No campaign history UI.** Users cannot browse or revisit past campaigns through the interface.
- **No publishing to social platforms.** The app does not post to Instagram, Facebook, or any other platform.
- **No multi-image support.** Each campaign produces exactly one image.
- **No branching or parallel workflows.** The agent pipeline is strictly linear (with one rejection loop point).
- **No more than five localization markets.** Only Spain, France, Germany, Brazil, and Japan are supported.
- **No multi-user or concurrent usage.** The app is designed for a single user at a time.
- **No silent degradation on DB failure.** If the database is unreachable, the system shows an error rather than falling back to in-memory state.

## 6. Constraints & Assumptions

### Technical Constraints
- The agent pipeline is linear: Planner → Creative Generator → Copy Reviewer → Human Approval → Localizer.
- The only loop in the pipeline is rejection at the approval gate, which returns to the Creative Generator.
- Image generation may take up to one minute; the UI must provide progress feedback during this time.
- Localization is limited to five markets maximum (Spain, France, Germany, Brazil, Japan).
- One image per campaign — no galleries or multi-asset generation.

### Assumptions
- An AI image generation service (e.g., DALL-E) is available and configured.
- An LLM service (e.g., GPT-4) is available for all text-generation agents (planning, copy review, localization).
- The application runs in a single-user context — no concurrent campaign creation.
- Network connectivity to AI services is generally reliable; the system retries transient AI failures up to 3 times before surfacing an error.
- If the database is unreachable, the system surfaces an error to the user rather than silently degrading.

## 7. Success Criteria

1. **End-to-end demo flow completes.** A user can go from a plain-English brief to a fully localized campaign (with real AI-generated image) in a single uninterrupted session.
2. **Human-in-the-loop works.** The approval gate fully pauses the workflow, and rejection with feedback produces new creative output (image URL differs if image was regenerated; caption text differs from previous iteration).
3. **Streaming is visible.** Text-generating agent responses stream token-by-token into the chat — the user sees progressive output, not loading spinners followed by a block of text. Image generation shows progress messages instead of streaming.
4. **Timeline reflects reality.** The visual timeline accurately tracks the current workflow stage in real time, including rejection loops and skipped localization.
5. **Localization is parallel and culturally adapted.** Multiple markets are translated simultaneously, and localized hashtags may differ from literal translations of the English hashtags; captions are in the target language (detectable via language identification).
6. **Persistence enables resumption.** Campaign data survives page refresh, restoring to the last completed stage. If the database is unreachable, the user sees an error.
7. **Observability is actionable.** Traces, logs, and metrics provide clear visibility into agent performance, rejection rates, and workflow timing.
