# FRD: Localization

**Feature ID**: `localization`
**PRD Reference**: §4.6 Localization (Agent 4)
**Status**: Draft

## 1. Overview

The Localizer is the fourth and final agent in the campaign pipeline. After the human approves the creative package, the Localizer prompts the user to select target markets, then translates and culturally adapts the caption and hashtags for each selected market. Translations are processed in parallel, preserve marketing tone, and are displayed alongside the original English content. The user may also skip localization entirely, completing the workflow with English-only content.

## 2. User Stories

- **US-11**: As a campaign creator, I want to select which markets to localize into after approving the creative so that I control where the campaign targets.
- **US-12**: As a campaign creator, I want to pick any combination of the five supported markets (Spain, France, Germany, Brazil, Japan), say "all," or skip localization entirely so that I have full flexibility.
- **US-13**: As a campaign creator, I want translations to preserve marketing tone and cultural nuance so that localized content feels native to each market.
- **US-14**: As a campaign creator, I want the original English content kept alongside translations so that I can compare them.

## 3. Functional Requirements

### FR-1: Market Selection Prompt

- **Description**: After creative approval, the Localizer prompts the user to select target markets for localization.
- **Input**: Workflow transition from approval gate to localization.
- **Output**: Interactive market selection UI rendered in the chat.
- **Behavior**:
  1. The market selection prompt is displayed inline in the chat immediately after approval.
  2. The prompt presents the five supported markets as selectable options:
     - 🇪🇸 Spain (Spanish — `es`)
     - 🇫🇷 France (French — `fr`)
     - 🇩🇪 Germany (German — `de`)
     - 🇧🇷 Brazil (Portuguese — `pt-BR`)
     - 🇯🇵 Japan (Japanese — `ja`)
  3. The user can select any combination of the five markets (multi-select).
  4. An "All Markets" shortcut selects all five.
  5. A "Skip Localization" option is available to skip entirely.
  6. The selection is confirmed with a submit/confirm action — not auto-submitted on selection.
  7. The workflow pauses at this prompt until the user makes a selection and confirms.
- **Error handling**: If the market selection prompt fails to render, an error message is shown with a retry button.
- **Acceptance criteria**:
  - Given the creative is approved, When the Localizer activates, Then the market selection prompt is displayed in the chat.
  - Given the prompt is displayed, When the user views it, Then all five markets are available as selectable options.
  - Given the prompt, When the user selects Spain and France and confirms, Then only those two markets are selected.
  - Given the prompt, When the user clicks "All Markets", Then all five markets are selected.
  - Given the prompt, When the user clicks "Skip Localization", Then no markets are selected and skip is confirmed.

### FR-2: Supported Markets Definition

- **Description**: Exactly five markets are supported, each with a defined locale code and language.
- **Input**: None (static configuration).
- **Output**: Market definitions used throughout the localization process.
- **Behavior**:
  1. The supported markets are:

     | Market | Language | Locale Code |
     |--------|----------|-------------|
     | Spain | Spanish | `es` |
     | France | French | `fr` |
     | Germany | German | `de` |
     | Brazil | Portuguese (Brazilian) | `pt-BR` |
     | Japan | Japanese | `ja` |

  2. No other markets are supported. The selection UI does not allow custom market entry.
  3. The maximum number of markets is 5 (all of the above).
  4. The locale codes are used internally for LLM prompts and as identifiers in the output.
- **Error handling**: N/A — this is static configuration.
- **Acceptance criteria**:
  - Given the market selection prompt, When the user views it, Then exactly five markets are listed.
  - Given the market list, When any market is selected, Then its locale code matches the defined codes above.

### FR-3: "All Markets" Selection

- **Description**: A convenience option to select all five markets at once.
- **Input**: User selects "All Markets" or types "all".
- **Output**: All five markets are selected.
- **Behavior**:
  1. Clicking "All Markets" checks/selects all five market checkboxes.
  2. If the user types "all" in a text input (if the prompt supports text input), it is interpreted as selecting all five markets.
  3. After selecting "All Markets", individual markets can be deselected (the "all" selection is not locked in).
- **Error handling**: None.
- **Acceptance criteria**:
  - Given the market selection prompt, When the user clicks "All Markets", Then all five markets are selected.
  - Given all markets are selected via "All", When the user deselects Japan, Then four markets remain selected.

### FR-4: Skip Localization

- **Description**: The user can skip localization entirely, completing the workflow with English-only content.
- **Input**: User selects "Skip Localization".
- **Output**: Workflow advances to completion with no translations.
- **Behavior**:
  1. Clicking "Skip Localization" bypasses the translation process entirely.
  2. No LLM calls are made for translation.
  3. The workflow advances directly to the completion stage.
  4. The campaign timeline updates: "Localizing" stage is skipped/greyed out, and the timeline advances to "Complete".
  5. The final campaign output contains only the original English caption and hashtags (no `localizedContent` array, or an empty array).
  6. The skip action is logged for observability.
- **Error handling**: If the skip transition fails, retry. If it continues to fail, show an error with a retry button.
- **Acceptance criteria**:
  - Given the market selection prompt, When the user clicks "Skip Localization", Then no translations are produced.
  - Given localization is skipped, When the campaign completes, Then the output contains only English content.
  - Given localization is skipped, When the timeline updates, Then the "Localizing" stage is skipped/greyed out.

### FR-5: Caption Translation with Marketing Tone Preservation

- **Description**: The approved English caption is translated for each selected market, preserving marketing tone and cultural nuance.
- **Input**: English caption (string), target market locale code, campaign plan `tone` field.
- **Output**: Translated caption in the target language.
- **Behavior**:
  1. The LLM is prompted to translate the caption into the target language.
  2. The translation preserves the marketing tone specified in the campaign plan (e.g., "Professional", "Playful").
  3. The translation adapts cultural nuances — idioms, humor, and references are localized, not literally translated.
  4. The translated caption maintains approximately the same length as the original (within Instagram caption constraints).
  5. The translation is in the target language (verifiable via language detection).
  6. Each market's translation is independent — the French translation does not depend on the Spanish translation.
- **Error handling**: See FR-9 (per-market retry). If translation fails for one market after retries, that market is reported as failed while others succeed.
- **Acceptance criteria**:
  - Given an English caption "Summer vibes only! ☀️", When translated for Spain (es), Then the result is in Spanish (detectable via language identification).
  - Given a campaign with tone "Playful", When the caption is translated, Then the playful tone is preserved in the translation.
  - Given translations for multiple markets, When each is produced, Then they are independent (not derived from each other).

### FR-6: Hashtag Adaptation

- **Description**: Hashtags are adapted (not literally translated) for each target market.
- **Input**: English hashtags (string[]), target market locale code.
- **Output**: Adapted hashtags for the target market.
- **Behavior**:
  1. The LLM adapts hashtags for the target market — this is NOT literal translation.
  2. Adapted hashtags should be relevant to the target market's social media culture.
  3. The number of hashtags may differ from the English set (5–10 range still applies).
  4. Some hashtags may remain in English if they are internationally recognized (e.g., brand names, universal terms).
  5. Adapted hashtags should differ from a simple word-for-word translation of the English hashtags.
- **Error handling**: Same as caption — per-market retry. Failed markets are reported individually.
- **Acceptance criteria**:
  - Given English hashtags including "#SummerVibes", When adapted for Japan (ja), Then at least some hashtags differ from a literal translation.
  - Given adapted hashtags for any market, When counted, Then there are between 5 and 10 hashtags.
  - Given adapted hashtags, When compared to the English set, Then they are not all identical to the English hashtags.

### FR-7: Parallel Processing of Multiple Markets

- **Description**: When multiple markets are selected, translations are processed in parallel, not sequentially.
- **Input**: Array of selected market locale codes.
- **Output**: All translations complete, with total time less than sequential execution.
- **Behavior**:
  1. Each market's translation (caption + hashtags) is dispatched as an independent parallel task.
  2. All markets are processed concurrently — the Localizer does not wait for Spain to finish before starting France.
  3. Results are collected as each market completes. Early completions are displayed immediately (streaming results).
  4. The observability trace shows one parent span with child spans per market, confirming parallelism.
  5. If one market fails and others succeed, the successful results are still displayed. The failed market is reported with an error.
- **Error handling**: Per-market failure isolation — one market's failure does not block or cancel others.
- **Acceptance criteria**:
  - Given 3 markets selected, When localization runs, Then all 3 are processed in parallel (observable via tracing — child spans overlap).
  - Given 5 markets selected and 1 fails, When results are displayed, Then 4 successful translations and 1 error are shown.

### FR-8: Original English Preservation

- **Description**: The original English caption and hashtags are preserved alongside all translations.
- **Input**: Approved English caption and hashtags.
- **Output**: English content included in the final localization output.
- **Behavior**:
  1. The final localization output includes the original English caption and hashtags as the first entry.
  2. English content is labeled as "English (Original)" or equivalent.
  3. English content is displayed in the chat alongside the translations for easy comparison.
  4. The English content is not modified or re-translated — it is the exact approved version.
- **Error handling**: None — English content is passed through without transformation.
- **Acceptance criteria**:
  - Given localization completes for Spain and France, When the results are displayed, Then the original English caption and hashtags are also shown.
  - Given the original caption is "Summer vibes only! ☀️", When displayed in the localization results, Then the English entry shows exactly "Summer vibes only! ☀️".

### FR-9: Per-Market LLM Failure Handling with Retries

- **Description**: Each market's translation independently retries on LLM failure, up to 3 total attempts (1 initial + 2 retries).
- **Input**: LLM call for a specific market's translation.
- **Output**: Successful translation or error report for that market.
- **Behavior**:
  1. Each market's LLM call (caption translation + hashtag adaptation) is retried independently on failure.
  2. Retry strategy: up to 3 total attempts per market (1 initial + 2 retries) with exponential backoff.
  3. If a market's translation fails after all 3 attempts:
     - The market is marked as failed in the output.
     - An error message for that market is displayed in the chat (e.g., "❌ Japan — Translation failed after 3 attempts").
     - Other markets' translations are unaffected.
  4. If all markets fail, the localization output shows all errors and a manual retry button is displayed.
  5. Transient errors (network timeouts, rate limits) are retried. Non-transient errors are not.
  6. The retry button for partial failures passes the list of failed markets. Only those markets are re-translated; successful translations are preserved.
- **Error handling**: After all 3 attempts fail for a market, that market is reported as failed. A manual retry button allows re-attempting failed markets only.
- **Acceptance criteria**:
  - Given a transient LLM failure for France on the first attempt, When the system retries, Then France's translation completes on a subsequent attempt.
  - Given 3 consecutive failures for Japan, When retries are exhausted, Then Japan is reported as failed while other markets succeed.
  - Given all markets fail after retries, When the error is displayed, Then a manual retry button is shown.

### FR-10: Localization Results Display

- **Description**: All translations are displayed in the chat upon completion.
- **Input**: Completed translations for all selected markets plus English original.
- **Output**: Formatted display of all localized content in the chat.
- **Behavior**:
  1. Results are displayed progressively in the chat — each market's translation appears as soon as it completes.
  2. Each market's results are displayed with:
     - Market name and flag emoji.
     - Translated caption.
     - Adapted hashtags.
  3. The English original is displayed first. Translations appear as they complete — markets that finish earlier appear first. The display updates in real-time as parallel translations complete.
  4. Failed markets (if any) show an error indicator instead of translations.
  5. After all results are displayed, the workflow transitions to the completion summary.
  6. The streaming behavior: explanatory text streams token-by-token, then each market's results appear progressively as translations complete.
- **Error handling**: If the display rendering fails, raw JSON is shown as a fallback.
- **Acceptance criteria**:
  - Given translations for Spain and France, When displayed in chat, Then both markets show translated caption and adapted hashtags.
  - Given translations complete, When the results are rendered, Then the English original is shown first.
  - Given all results are displayed, When the workflow continues, Then it transitions to the completion summary.

## 4. Data Model

```typescript
/** Supported market locale codes */
type MarketLocale = "es" | "fr" | "de" | "pt-BR" | "ja";

/** Supported market definition */
interface SupportedMarket {
  /** Locale code */
  locale: MarketLocale;
  /** Display name */
  name: string;
  /** Language name */
  language: string;
  /** Flag emoji */
  flag: string;
}

/** The five supported markets (static) */
const SUPPORTED_MARKETS: SupportedMarket[] = [
  { locale: "es", name: "Spain", language: "Spanish", flag: "🇪🇸" },
  { locale: "fr", name: "France", language: "French", flag: "🇫🇷" },
  { locale: "de", name: "Germany", language: "German", flag: "🇩🇪" },
  { locale: "pt-BR", name: "Brazil", language: "Portuguese", flag: "🇧🇷" },
  { locale: "ja", name: "Japan", language: "Japanese", flag: "🇯🇵" },
];

/** User's market selection */
interface MarketSelection {
  /** Selected market locale codes (empty array means skip) */
  selectedMarkets: MarketLocale[];
  /** Whether the user explicitly skipped localization */
  skipped: boolean;
  /** Optional list of failed markets for retry (only those markets are re-attempted) */
  failedMarkets?: MarketLocale[];
}

/** Localized content for a single market */
interface LocalizedContent {
  /** Market locale code */
  locale: MarketLocale;
  /** Market display name */
  marketName: string;
  /** Translated caption */
  caption: string;
  /** Adapted hashtags */
  hashtags: string[];
  /** Whether this translation succeeded */
  success: boolean;
  /** Error message if translation failed */
  error?: string;
}

/** Pipeline input to the Localizer agent (from upstream agents) */
interface LocalizationPipelineInput {
  /** Approved English caption */
  caption: string;
  /** Approved English hashtags */
  hashtags: string[];
  /** Campaign plan (for tone context) */
  campaignPlan: CampaignPlan;
}

// NOTE: MarketSelection is gathered within the Localizer agent's own execution
// (via the LangGraph interrupt in FR-1), not passed from the upstream pipeline.

/** Output from the Localizer agent */
interface LocalizationOutput {
  /** Original English content */
  original: {
    caption: string;
    hashtags: string[];
  };
  /** Localized content per market */
  localizedContent: LocalizedContent[];
  /** Whether localization was skipped */
  skipped: boolean;
}

/** Campaign state after localization stage */
interface CampaignAfterLocalization {
  id: string;
  brief: string;
  plan: CampaignPlan;
  creative: CreativeAssets;
  localization: LocalizationOutput;
  stage: 'localization-complete' | 'localization-error';
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}
```

## 5. API Contracts

### Agent Invocation (Internal — LangGraph Node)

The Localizer is a LangGraph node invoked after the Human Approval Gate approves.

**Input State:**
```
Method: LangGraph state transition from human-approval
Input fields:
  - caption: string (approved English caption)
  - hashtags: string[] (approved English hashtags)
  - campaignPlan: CampaignPlan
```

**Market Selection Interrupt:**
```
LangGraph interrupt (similar to approval gate)
Presents market selection prompt to user
Waits for user input:
  - selectedMarkets: MarketLocale[] (or empty for skip)
  - skipped: boolean
```

**Output State (after translations):**
```
Output fields:
  - localizationOutput: LocalizationOutput
  - nextStage: "complete"
```

### Streaming Protocol

- Market selection prompt: rendered as interactive UI (not streamed).
- Translation explanatory text: streamed token-by-token.
- Structured localization results (`LocalizationOutput`): delivered progressively — each market's result appears as soon as its translation completes.

## 6. UI/UX Requirements

### Market Selection Prompt
- Rendered inline in the chat as an interactive card/block.
- Five markets displayed as checkboxes or toggles, each with flag emoji and market name.
- "All Markets" button/shortcut selects all five.
- "Skip Localization" button to bypass.
- "Confirm" / "Start Localization" button to submit the selection.
- Selection state is visually clear (checked/unchecked).

### Progress During Localization
- A progress indicator shows which markets are being processed.
- As each market completes, its result appears in the chat (progressive display).
- Status messages during processing (e.g., "Translating for Spain…", "Translating for France…").

### Results Display
- Structured block showing all translations.
- Each market section includes:
  - Flag emoji + market name as a heading.
  - Translated caption.
  - Adapted hashtags displayed inline.
- English original shown first with "English (Original)" label.
- Failed markets show a red error indicator with the failure message.

### Post-Selection State
- After confirming market selection, the selection UI becomes non-interactive.
- After localization completes, the workflow transitions to the completion summary card.

## 7. Dependencies

- **Human Approval Gate (`human-approval`)**: Triggers the Localizer after creative approval. Provides the approved caption and hashtags.
- **Campaign Planning (`campaign-planning`)**: Provides the campaign plan (tone context for translation).
- **Chat Interface (`chat-interface`)**: Renders the market selection UI and localization results.
- **Campaign Timeline (`campaign-timeline`)**: Shows "Localizing" as active during translation, skips/greys out if localization is skipped.
- **Data Persistence (`data-persistence`)**: Persists localization results as part of campaign data.
- **LLM Service**: External AI service for caption translation and hashtag adaptation.

## 8. Acceptance Criteria Summary

| ID | Criterion |
|----|-----------|
| AC-1 | The user is prompted to select markets after creative approval. |
| AC-2 | All five supported markets (Spain, France, Germany, Brazil, Japan) are available for selection. |
| AC-3 | Any combination of the five markets can be selected. |
| AC-4 | "All Markets" selects all five markets. |
| AC-5 | "Skip Localization" produces no translations and completes the workflow. |
| AC-6 | When localization is skipped, the timeline "Localizing" stage is skipped/greyed out. |
| AC-7 | Each selected market receives a translated caption in the target language (detectable via language identification). |
| AC-8 | Hashtags are adapted (not literally translated) per market — they may differ from literal English translations. |
| AC-9 | Translated hashtags count is between 5 and 10 per market. |
| AC-10 | The original English caption and hashtags are preserved and displayed alongside translations. |
| AC-11 | Multiple markets are processed in parallel (not sequentially), observable via tracing. |
| AC-12 | Per-market LLM failures are retried up to 3 total attempts per market (1 initial + 2 retries) with exponential backoff. |
| AC-13 | If one market fails after retries, the other markets' translations still succeed and display. |
| AC-14 | If all markets fail after retries, an error message with a retry button is displayed. |
| AC-15 | Localization results are displayed in the chat with market name, flag, caption, and hashtags per market. |
| AC-16 | The market selection UI becomes non-interactive after confirmation. |
