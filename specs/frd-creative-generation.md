# FRD: Creative Generation

**Feature ID**: `creative-generation`
**PRD Reference**: §4.3 Creative Generation (Agent 2)
**Status**: Draft

## 1. Overview

The Creative Generation feature implements the second agent in the marketing campaign pipeline. It receives the structured campaign plan from the Campaign Planner and produces real AI-generated creative assets: a campaign image, an Instagram-optimized caption (100–300 characters), and a set of relevant hashtags (5–10). This agent supports rejection-regeneration loops where the user can request new creative output with feedback, choosing between regenerating everything or keeping the image and redoing only the text. Generated images are stored and served via URL. Upon successful generation, the agent automatically hands off to the Copy Reviewer.

## 2. User Stories

This FRD covers the following user stories from the PRD:

- **US-5**: As a campaign creator, I want the Creative Generator agent to produce an AI-generated image and Instagram-optimized caption with hashtags so that I get real creative assets, not placeholders.
- **US-8**: As a campaign creator, I want to reject creative assets with written feedback so that the Creative Generator can incorporate my notes and produce improved output.
- **US-9**: As a campaign creator, I want the rejection loop to return to the Creative Generator (not the Planner) so that the strategy is preserved while only the creative is reworked.
- **US-10**: As a campaign creator, I want to be able to reject and loop as many times as needed so that I'm never forced to accept unsatisfactory output.
- **US-17**: As a campaign creator, I want status messages during image generation so that I know the system is working during the wait (up to a minute).
- **US-20**: As a campaign creator, I want the system to automatically retry failed AI calls so that transient errors don't disrupt my workflow.
- **US-23**: As a campaign creator, I want to choose between regenerating just the text or the full creative (including image) when rejecting so that I don't wait for a new image when only the copy needs work.

## 3. Functional Requirements

### FR-1: Receive Structured Plan from Planner

- **Description**: The Creative Generator receives the full structured campaign plan produced by the Campaign Planner as its input.
- **Input**: A `CampaignPlan` object with all seven fields (campaignName, objective, targetAudience, keyMessages, visualDirection, tone, platform).
- **Output**: The plan is available for use in image prompt construction, caption generation, and hashtag generation.
- **Behavior**:
  1. The Creative Generator is invoked by the orchestration layer after the Campaign Planner completes.
  2. The full `CampaignPlan` is passed as input — no re-querying or re-generating the plan.
  3. The agent validates that all required plan fields are present and non-empty.
  4. The `visualDirection` field is the primary input for the image generation prompt.
  5. The `tone`, `keyMessages`, and `platform` fields inform caption and hashtag style.
- **Error handling**: If the plan is missing required fields, the agent returns an error and does not proceed. This should not happen in normal flow (indicates an orchestration bug).
- **Acceptance criteria**:
  - Given the Campaign Planner has completed, when the Creative Generator starts, then it receives the full `CampaignPlan` object.
  - Given a plan with all fields populated, when the generator validates input, then validation passes and generation begins.

### FR-2: AI Image Generation

- **Description**: The agent generates a real AI image (not a placeholder or stock photo) aligned with the campaign plan's visual direction.
- **Input**: The `visualDirection` field from the campaign plan, plus campaign context (name, objective, tone).
- **Output**: A generated image (binary data) saved to persistent storage with a servable URL.
- **Behavior**:
  1. The agent constructs an image generation prompt using:
     - The `visualDirection` field as the primary creative direction.
     - The `campaignName` and `objective` for contextual alignment.
     - The `platform` to optimize aspect ratio (e.g., 1:1 for Instagram).
  2. The prompt is sent to an AI image generation service (gpt-image-1).
  3. Image generation may take up to 60 seconds.
  4. During generation, status messages are emitted to the chat (see FR-5).
  5. The returned image is binary image data (PNG or JPEG).
  6. The image is saved to persistent storage (file system or blob storage).
  7. A servable URL is generated for the stored image.
  8. The image is NOT a placeholder, stub, stock photo URL, or text description — it is a real AI-generated image.
- **Error handling**: If image generation fails, the system makes up to 3 total attempts (1 initial + 2 retries, see FR-9). If all attempts fail, an error is surfaced with a retry button.
- **Acceptance criteria**:
  - Given a plan with visualDirection "Bright outdoor fitness scene," when image generation completes, then binary image data is returned (not a URL to an external stock photo or a placeholder).
  - Given the image is generated, when it is saved, then it is retrievable via a URL.
  - Given the platform is "Instagram," when the image prompt is constructed, then a 1:1 aspect ratio is requested.

### FR-3: Caption Generation

- **Description**: The agent generates an Instagram-optimized caption between 100 and 300 characters.
- **Input**: The campaign plan (keyMessages, tone, objective, platform) and the generated image context.
- **Output**: A caption string between 100 and 300 characters.
- **Behavior**:
  1. The agent sends a prompt to the LLM requesting a caption optimized for the target platform.
  2. The prompt includes: key messages, brand tone, campaign objective, and a description of the generated image.
  3. The LLM is instructed to produce a caption between 100 and 300 characters.
  4. Post-generation validation: if the caption is shorter than 100 characters, the LLM is re-prompted with a request to expand. If longer than 300 characters, the LLM is re-prompted to shorten.
  5. A maximum of 2 re-prompt attempts are made for length adjustment. If the caption still doesn't meet constraints after re-prompts, the agent truncates to 300 characters (appending "…") or pads with a call-to-action to reach 100 characters.
  6. The caption must be a single text block (no line breaks).
- **Error handling**: If the LLM fails to generate a caption, the retry logic in FR-9 applies.
- **Acceptance criteria**:
  - Given a plan with tone "Professional" and keyMessages about summer fitness, when a caption is generated, then it is between 100 and 300 characters (inclusive).
  - Given the LLM returns a 50-character caption, when post-validation runs, then the agent re-prompts for a longer version.
  - Given the LLM returns a 400-character caption, when post-validation runs, then the agent re-prompts for a shorter version.
  - Given 2 re-prompt attempts fail to produce a valid-length caption, when the fallback triggers, then the caption is force-adjusted to meet the 100–300 constraint.

### FR-4: Hashtag Generation

- **Description**: The agent generates 5 to 10 relevant hashtags for the campaign.
- **Input**: The campaign plan (keyMessages, targetAudience, platform) and the generated caption.
- **Output**: An array of 5 to 10 hashtag strings.
- **Behavior**:
  1. The agent sends a prompt to the LLM requesting hashtags relevant to the campaign.
  2. The prompt includes: key messages, target audience, platform, and the caption.
  3. The LLM is instructed to produce between 5 and 10 hashtags.
  4. Each hashtag must start with `#` and contain no spaces.
  5. Post-generation validation:
     - If fewer than 5 hashtags, the LLM is re-prompted to generate more.
     - If more than 10 hashtags, the list is truncated to 10 (keeping the most relevant ones as determined by the LLM ordering).
  6. Duplicate hashtags are removed.
  7. Hashtags are returned as an ordered array (most relevant first).
- **Error handling**: If the LLM fails to generate hashtags, the retry logic in FR-9 applies.
- **Acceptance criteria**:
  - Given a campaign plan, when hashtags are generated, then the output contains between 5 and 10 hashtags.
  - Given the LLM returns 3 hashtags, when post-validation runs, then the agent re-prompts for more.
  - Given the LLM returns 15 hashtags, when post-validation runs, then the list is truncated to 10.
  - Given the output contains duplicates, when post-validation runs, then duplicates are removed.
  - Given the output, when validated, then each hashtag starts with `#` and contains no spaces.

### FR-5: Status Messages During Generation

- **Description**: During image generation (which can take up to a minute), the agent emits status messages to the chat so the user knows the system is working.
- **Input**: Image generation is in progress.
- **Output**: One or more status messages emitted to the chat stream.
- **Behavior**:
  1. When image generation begins, a status message is emitted: "🎨 Generating your campaign image…"
  2. If generation takes longer than 15 seconds, an additional status message is emitted: "⏳ Still working on your image — this can take up to a minute…"
  3. If generation takes longer than 40 seconds, another status message is emitted: "🔄 Almost there — putting the finishing touches on your image…"
  4. Status messages are displayed in the chat as system/status messages (not as streaming text).
  5. When image generation completes, a final status update is emitted: "✅ Image generated!"
  6. Caption and hashtag generation are faster (typically < 10 seconds) and do not require status messages — the standard streaming UX applies.
- **Error handling**: If image generation fails during status message emission, the error handling in FR-9 takes over.
- **Acceptance criteria**:
  - Given image generation starts, then the first status message appears immediately.
  - Given image generation takes 20 seconds, then a second status message appears after 15 seconds.
  - Given image generation takes 50 seconds, then a third status message appears after 40 seconds.
  - Given image generation completes, then a completion status message appears.

### FR-6: Rejection with "Regenerate All" Scope

- **Description**: When the user rejects creative with "Regenerate All" scope, the agent regenerates the image, caption, and hashtags incorporating the user's feedback.
- **Input**: Rejection feedback string and scope `regenerate-all`, plus the original campaign plan.
- **Output**: A new set of creative assets (new image, new caption, new hashtags).
- **Behavior**:
  1. The Creative Generator is re-invoked by the orchestration layer with:
     - The original `CampaignPlan` (unchanged — the Campaign Planner is NOT re-invoked).
     - The rejection feedback text.
     - The rejection scope: `regenerate-all`.
     - The previous creative iteration (for context on what to improve).
  2. The feedback is incorporated into the image generation prompt, caption prompt, and hashtag prompt.
  3. A completely new image is generated (different from the previous iteration).
  4. A new caption and new hashtags are generated.
  5. The new creative is assigned the next iteration version number (e.g., v2, v3).
  6. The new creative replaces the current output for downstream agents but the previous iteration remains visible in chat history.
  7. After regeneration completes, the workflow proceeds to Copy Review (auto-handoff), not directly back to the approval gate.
- **Error handling**: Regeneration failures follow the same retry logic as initial generation (FR-9).
- **Acceptance criteria**:
  - Given the user rejects with "Regenerate All" and feedback "Make it more colorful," when regeneration completes, then a new image URL (different from previous), new caption, and new hashtags are produced.
  - Given a rejection, when the Creative Generator runs, then it does NOT re-invoke the Campaign Planner.
  - Given regeneration completes, when the workflow continues, then it proceeds to Copy Review (not directly to the approval gate).

### FR-7: Rejection with "Keep Image, Redo Text" Scope

- **Description**: When the user rejects creative with "Keep Image, Redo Text" scope, the agent preserves the existing image and regenerates only the caption and hashtags.
- **Input**: Rejection feedback string and scope `keep-image-redo-text`, plus the original campaign plan and the current image.
- **Output**: The same image with new caption and new hashtags.
- **Behavior**:
  1. The Creative Generator is re-invoked with:
     - The original `CampaignPlan` (unchanged).
     - The rejection feedback text.
     - The rejection scope: `keep-image-redo-text`.
     - The current image URL (to be preserved).
     - The previous caption and hashtags (for context on what to improve).
  2. The image is NOT regenerated — the existing image URL is carried forward.
  3. A new caption is generated incorporating the feedback.
  4. New hashtags are generated incorporating the feedback.
  5. The same constraint enforcement applies (caption 100–300 chars, hashtags 5–10).
  6. The new creative iteration uses the same image but new text, and is assigned the next version number.
  7. No image generation status messages are emitted (since no image is being generated).
  8. After regeneration completes, the workflow proceeds to Copy Review (auto-handoff).
- **Error handling**: LLM failures for caption/hashtag regeneration follow the retry logic in FR-9.
- **Acceptance criteria**:
  - Given the user rejects with "Keep Image, Redo Text" and feedback "Make the caption shorter," when regeneration completes, then the image URL is identical to the previous iteration and the caption/hashtags are different.
  - Given "Keep Image, Redo Text" scope, when regeneration runs, then no image generation status messages are emitted.
  - Given regeneration completes, when the new version is displayed, then it shows the same image with new text.

### FR-8: Feedback Incorporation on Rejection

- **Description**: When the user provides rejection feedback, the Creative Generator must incorporate that feedback into the regenerated output.
- **Input**: A rejection feedback string (required, non-empty) from the user.
- **Output**: Creative assets that demonstrably reflect the feedback.
- **Behavior**:
  1. The feedback string is appended to the generation prompts (image prompt for "Regenerate All," caption/hashtag prompts for both scopes).
  2. The prompt instructs the LLM to address the specific feedback while maintaining alignment with the campaign plan.
  3. The feedback from the CURRENT rejection is prioritized, but context from all previous rejections in the session is also provided.
  4. The agent does not guarantee the output will exactly match the feedback — it instructs the LLM to "incorporate" and "address" the feedback.
  5. If feedback is contradictory to the plan (e.g., "use a blue theme" when the plan says "warm tones"), the feedback takes priority over the plan's visual direction for this iteration.
- **Error handling**: Not applicable — feedback is always a string input to the LLM prompts.
- **Acceptance criteria**:
  - Given rejection feedback "Use warmer colors and include a sunset," when the image is regenerated, then the image prompt includes "warmer colors" and "sunset."
  - Given rejection feedback "Make the hashtags more specific to yoga," when hashtags are regenerated, then the hashtag prompt includes the yoga-specific request.
  - Given multiple rejections with cumulative feedback, when the latest regeneration runs, then the prompt includes context from all previous rejections.

### FR-9: Error Handling — Image Generation Failures with Retries

- **Description**: If AI calls fail during creative generation (image or text), the system makes up to 3 total attempts (1 initial + 2 retries) before surfacing an error.
- **Input**: A failed AI service call (image generation API or LLM API).
- **Output**: Either a successful result (after retry) or an error message with a retry button.
- **Behavior**:
  1. If an AI call fails (network error, timeout, rate limit, service error), the system retries automatically.
  2. Up to 3 total attempts (1 initial + 2 retries) are made with exponential backoff (e.g., 2s, 4s delays — longer backoff for image generation given the long base processing time).
  3. Retries are invisible to the user — the status messages continue normally.
  4. If all 3 attempts fail, an error message is displayed in the chat: "Creative generation failed. The AI service is temporarily unavailable."
  5. A "Retry" button is displayed. Clicking it re-invokes the Creative Generator from the beginning of the current step.
  6. Image generation and text generation (caption + hashtags) are separate steps — a failure in one does not require retrying the other if it already succeeded.
  7. Specifically: if the image generates successfully but caption generation fails, only the caption generation is retried (the image is preserved).
  8. Only transient errors (timeouts, rate limits, 5xx responses) are retried. Non-transient errors (invalid API key, content policy violation, malformed request) fail immediately with an error message.
  9. If caption generation succeeds but hashtag generation fails, the retry re-runs the entire text generation step (both caption and hashtags). Partial text output is not preserved across retries.
- **Error handling**: This IS the error handling specification.
- **Acceptance criteria**:
  - Given image generation fails once and succeeds on the second attempt, when the image returns, then the user sees only the successful result.
  - Given all 3 image generation attempts fail, when the error surfaces, then an error message and "Retry" button are shown.
  - Given the image succeeds but caption generation fails after all retries, when the error surfaces, then the error is for caption generation only and the image is preserved.

### FR-10: Image Storage and URL Serving

- **Description**: Generated images are saved to persistent storage and served via a stable URL.
- **Input**: Binary image data returned from the image generation API.
- **Output**: The image saved to storage with a servable URL.
- **Behavior**:
  1. The binary image data is received from the image generation API.
  2. The image is saved to persistent storage with a unique filename (e.g., `{campaignId}/{iterationVersion}.png`).
  3. A URL is generated that can serve the image to the frontend (e.g., `/api/campaign/{campaignId}/image/{version}`).
  4. The URL is stored in the campaign state alongside the creative data.
  5. The URL remains valid across page refreshes and for the lifetime of the campaign data.
  6. Images from previous iterations (before rejection-regeneration) are also preserved and accessible.
- **Error handling**: If the image cannot be saved to storage, the generation step is treated as failed and retry logic applies.
- **Acceptance criteria**:
  - Given an image is generated, when it is saved, then it is retrievable via the generated URL.
  - Given the user refreshes the page, when the campaign is restored, then the image URL still works.
  - Given a rejection-regeneration cycle, when a new image is generated, then both the old and new images are accessible via their respective URLs.

### FR-11: Auto-Handoff to Copy Reviewer

- **Description**: After creative generation (initial or regeneration) completes, the workflow automatically hands off to the Copy Reviewer agent.
- **Input**: Completed creative assets (image URL, caption, hashtags) and the campaign plan.
- **Output**: The Copy Reviewer agent is invoked.
- **Behavior**:
  1. Once creative assets are fully generated (image saved, caption validated, hashtags validated), the Creative Generator signals completion.
  2. The orchestration layer automatically invokes the Copy Reviewer agent, passing: the caption, hashtags, and the campaign plan.
  3. No user action is required — the handoff is automatic.
  4. The timeline updates to show "Generating" as complete and "Reviewing" as active.
  5. This handoff occurs both after initial generation AND after each rejection-regeneration cycle.
- **Error handling**: If the handoff fails, the error is treated as a pipeline error with retry logic per `chat-interface` FR-8.
- **Acceptance criteria**:
  - Given creative generation completes, when the generator finishes, then the Copy Reviewer starts automatically.
  - Given a rejection-regeneration cycle completes, when the new creative is ready, then the Copy Reviewer starts automatically (not the approval gate directly).
  - Given the handoff occurs, when the timeline updates, then "Generating" is complete and "Reviewing" is active.

## 4. Data Model

```typescript
/** Creative assets produced by the Creative Generator */
interface CreativeAssets {
  imageUrl: string;               // URL to the stored AI-generated image
  caption: string;                // Instagram-optimized caption (100–300 chars)
  hashtags: string[];             // 5–10 relevant hashtags (each starts with #)
  iterationVersion: number;       // 1-based version number (v1, v2, v3, ...)
}

/** Creative generation constraints */
const CREATIVE_CONSTRAINTS = {
  captionMinLength: 100,
  captionMaxLength: 300,
  hashtagsMin: 5,
  hashtagsMax: 10,
  maxCaptionRepromptAttempts: 2,
  maxRetryAttempts: 3,
} as const;

/** Input to the Creative Generator agent */
interface CreativeGeneratorInput {
  plan: CampaignPlan;             // Structured plan from Campaign Planner
  rejectionFeedback?: string;     // Feedback from rejection (undefined on first run)
  rejectionScope?: 'regenerate-all' | 'keep-image-redo-text';
  previousIterations?: CreativeIteration[];  // History of previous attempts
  currentImageUrl?: string;       // Preserved image URL for "keep-image-redo-text"
}

/** Single creative iteration record */
interface CreativeIteration {
  version: number;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  feedback?: string;              // Feedback that led to this iteration (undefined for v1)
  scope?: 'regenerate-all' | 'keep-image-redo-text';
  generatedAt: string;            // ISO 8601
}

/** Creative Generator output */
interface CreativeGeneratorOutput {
  assets: CreativeAssets;
  imageGenerated: boolean;        // false when scope is "keep-image-redo-text"
  generationDurationMs: number;   // Total generation time for observability
}

/** Campaign state after creative generation stage */
interface CampaignAfterCreative {
  id: string;
  brief: string;
  plan: CampaignPlan;
  creative: CreativeAssets;
  creativeHistory: CreativeIteration[];
  stage: 'creative-complete' | 'creative-error';
  rejectionCount: number;
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/** Image storage reference */
interface StoredImage {
  campaignId: string;
  version: number;
  filename: string;               // e.g., "camp_abc123/v1.png"
  mimeType: 'image/png' | 'image/jpeg';
  sizeBytes: number;
  url: string;                    // Servable URL
  createdAt: string;              // ISO 8601
}
```

## 5. API Contracts

### Get Creative Assets

- **Method**: `GET`
- **Path**: `/api/campaign/{campaignId}/creative`
- **Response**:
  ```json
  {
    "assets": {
      "imageUrl": "/api/campaign/camp_abc123/image/1",
      "caption": "Embrace the energy of summer fitness! Transform your routine with outdoor workouts that inspire confidence and strength. 🌞💪",
      "hashtags": ["#SummerFitness", "#OutdoorWorkout", "#FitnessGoals", "#HealthyLiving", "#GetFit", "#SummerVibes"],
      "iterationVersion": 1
    },
    "history": [
      {
        "version": 1,
        "imageUrl": "/api/campaign/camp_abc123/image/1",
        "caption": "...",
        "hashtags": ["..."],
        "generatedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

### Serve Generated Image

- **Method**: `GET`
- **Path**: `/api/campaign/{campaignId}/image/{version}`
- **Response**: Binary image data with appropriate `Content-Type` header (`image/png` or `image/jpeg`).
- **Status codes**:
  - `200` — image found and served.
  - `404` — image not found for this campaign/version.

### Submit Rejection (triggers regeneration)

- **Method**: `POST`
- **Path**: `/api/campaign/{campaignId}/approve`
- **Request body** (rejection):
  ```json
  {
    "action": "reject",
    "feedback": "Make the colors warmer and the caption more energetic",
    "rejectionScope": "regenerate-all"
  }
  ```
- **Response**: `{ "status": "accepted", "nextIteration": 2 }`

## 6. UI/UX Requirements

- **Image display**: The generated image is displayed inline in the chat at a reasonable preview size (max 400px width) with an option to view full-size in a lightbox/overlay.
- **Caption display**: The caption is displayed below the image as formatted text. Character count is shown (e.g., "243 / 300 chars").
- **Hashtag display**: Hashtags are displayed as styled chips/pills below the caption. Each chip is a distinct, visually separated element.
- **Status messages**: During image generation, animated status messages appear in the chat (see FR-5). The animation provides visual feedback that the system is working.
- **Iteration numbering**: Each creative version is labeled (e.g., "Creative v1", "Creative v2") with the version number prominently displayed.
- **Previous iterations**: Older iterations remain visible in the chat scroll history. They are visually marked as superseded (e.g., slightly dimmed or labeled "Previous version").
- **Rejection UX**: The rejection flow is handled by the approval gate UI (see `chat-interface` FRD FR-6). The Creative Generator only receives the feedback and scope — it does not render UI controls.

## 7. Dependencies

- **`campaign-planning`**: Provides the `CampaignPlan` input. The Creative Generator cannot run without a completed plan.
- **`chat-interface`**: Displays status messages, streams text output, and renders the creative preview. The approval gate UI handles the rejection interaction.
- **`copy-review`**: The downstream agent that receives creative assets via auto-handoff.
- **`human-approval`**: The approval gate that may trigger rejection-regeneration loops.
- **AI image generation service**: OpenAI gpt-image-1 must be configured for real image generation.
- **LLM service**: An external LLM (e.g., GPT-4) must be available for caption and hashtag generation.
- **`data-persistence`**: Creative assets and iteration history must be persisted. Images must be stored and served.
- **`campaign-timeline`**: The timeline must reflect the "Generating" stage.

## 8. Acceptance Criteria Summary

1. A real AI-generated image is produced (binary image data, not a placeholder, stub, or stock photo URL).
2. The generated image is saved to persistent storage and servable via a stable URL.
3. The caption is between 100 and 300 characters (inclusive), enforced by constraint validation and re-prompting.
4. Between 5 and 10 hashtags are generated, each starting with `#` and containing no spaces.
5. Status messages appear in the chat during image generation (immediately, after 15s, after 40s).
6. On rejection with "Regenerate All" scope, a completely new image, caption, and hashtags are produced using the feedback.
7. On rejection with "Keep Image, Redo Text" scope, the existing image is preserved and only the caption and hashtags are regenerated using the feedback.
8. The Campaign Planner is NOT re-invoked on rejection — the original plan is preserved.
9. After regeneration, the workflow proceeds to Copy Review (not directly to the approval gate).
10. Rejection-regeneration loops can repeat unlimited times.
11. Each creative iteration is numbered (v1, v2, v3, …) and previous iterations remain accessible.
12. Image and text generation failures are retried up to 3 total attempts (1 initial + 2 retries) automatically. On total failure, an error message with a "Retry" button is shown.
13. If the image succeeds but text generation fails, only text generation is retried (the image is preserved).
14. The auto-handoff to Copy Reviewer occurs after both initial generation and after each rejection-regeneration cycle.
