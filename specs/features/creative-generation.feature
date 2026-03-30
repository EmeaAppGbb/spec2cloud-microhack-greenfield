@inc-02
Feature: Creative Generation — AI Image, Caption & Hashtag Pipeline
  As a marketing user
  I want the Creative Generator to produce an AI-generated image, caption, and hashtags from my campaign plan
  So that I receive real creative assets aligned with the plan without manual design work

  Background:
    Given the application is loaded
    And a campaign brief has been submitted
    And the Campaign Planner has completed with a valid plan

  # ---------------------------------------------------------------------------
  # FR-1: Receive Structured Plan — Auto-Start After Planner
  # ---------------------------------------------------------------------------

  @api
  Scenario: Creative Generator auto-starts after planner completes
    When the Campaign Planner signals completion with a valid plan
    Then the Creative Generator agent starts automatically
    And it receives the full CampaignPlan object with all seven fields

  @api
  Scenario: Creative Generator validates all required plan fields
    Given the Creative Generator receives a CampaignPlan
    Then the plan contains non-empty "campaignName"
    And the plan contains non-empty "objective"
    And the plan contains non-empty "targetAudience"
    And the plan contains non-empty "keyMessages"
    And the plan contains non-empty "visualDirection"
    And the plan contains non-empty "tone"
    And the plan contains non-empty "platform"

  # ---------------------------------------------------------------------------
  # FR-2: AI Image Generation
  # ---------------------------------------------------------------------------

  @api
  Scenario: Image is generated as real binary data from gpt-image-1
    When the Creative Generator produces an image
    Then the image is real AI-generated binary data (not a placeholder or stock URL)
    And the image is in PNG or JPEG format

  @ui
  Scenario: Generated image is displayed inline in the chat
    When the Creative Generator completes image generation
    Then a creative preview block appears in the chat
    And the preview contains an inline image element with a valid src URL

  # ---------------------------------------------------------------------------
  # FR-3: Caption Generation
  # ---------------------------------------------------------------------------

  @api
  Scenario: Caption length is between 100 and 300 characters
    When the Creative Generator produces a caption
    Then the caption is at least 100 characters long
    And the caption is at most 300 characters long

  @api
  Scenario: Caption is a single text block with no line breaks
    When the Creative Generator produces a caption
    Then the caption does not contain any line break characters

  @ui
  Scenario: Caption is displayed in the creative preview
    When the Creative Generator completes
    Then the creative preview displays the caption text
    And the caption text is between 100 and 300 characters

  # ---------------------------------------------------------------------------
  # FR-4: Hashtag Generation
  # ---------------------------------------------------------------------------

  @api
  Scenario: Hashtag count is between 5 and 10
    When the Creative Generator produces hashtags
    Then the hashtag list contains at least 5 items
    And the hashtag list contains at most 10 items

  @api
  Scenario: Each hashtag starts with # and contains no spaces
    When the Creative Generator produces hashtags
    Then each hashtag starts with "#"
    And no hashtag contains a space character

  @api
  Scenario: Duplicate hashtags are removed
    Given the LLM returns hashtags with duplicates
    When post-validation runs
    Then the duplicate hashtags are removed
    And the remaining hashtags are between 5 and 10

  @ui
  Scenario: Hashtags are displayed as chips in the creative preview
    When the Creative Generator completes
    Then the creative preview displays hashtag chips
    And each chip shows a "#"-prefixed hashtag
    And there are between 5 and 10 hashtag chips

  # ---------------------------------------------------------------------------
  # FR-5: Status Messages During Generation
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Initial status message appears immediately when generation starts
    When the Creative Generator begins image generation
    Then a status message "🎨 Generating your campaign image…" appears in the chat

  @ui
  Scenario: Follow-up status message appears after 15 seconds
    Given the Creative Generator has been generating for more than 15 seconds
    Then a status message "⏳ Still working on your image — this can take up to a minute…" appears

  @ui
  Scenario: Third status message appears after 40 seconds
    Given the Creative Generator has been generating for more than 40 seconds
    Then a status message "🔄 Almost there — putting the finishing touches on your image…" appears

  @ui
  Scenario: Completion status message appears when generation finishes
    When the Creative Generator finishes image generation
    Then a status message "✅ Image generated!" appears in the chat

  # ---------------------------------------------------------------------------
  # FR-10: Image Storage and URL Serving
  # ---------------------------------------------------------------------------

  @api
  Scenario: Image is accessible via campaign image URL
    Given the Creative Generator has produced an image
    When a GET request is made to "/api/campaign/{id}/image/1"
    Then the response status is 200
    And the response content type is an image format

  @api
  Scenario: Image URL is stable across page refreshes
    Given the Creative Generator has produced an image at a URL
    When the page is refreshed
    Then the same image URL still returns the image successfully

  # ---------------------------------------------------------------------------
  # Creative Preview — Combined Display
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Creative preview shows image, caption, and hashtags together
    When the Creative Generator completes all generation steps
    Then the creative preview block is visible in the chat
    And the preview contains the generated image
    And the preview contains the caption text (100-300 characters)
    And the preview contains 5-10 hashtag chips each starting with "#"

  # ---------------------------------------------------------------------------
  # Timeline Stage Transitions
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Generating stage becomes active when creative generation starts
    When the Creative Generator starts
    Then the "Generating" timeline stage shows as "active"
    And the "Planning" timeline stage shows as "completed"

  @ui
  Scenario: Generating stage becomes completed when creative generation finishes
    When the Creative Generator completes successfully
    Then the "Generating" timeline stage shows as "completed"

  # ---------------------------------------------------------------------------
  # FR-11: Auto-Handoff to Copy Reviewer
  # ---------------------------------------------------------------------------

  @api
  Scenario: Auto-handoff signal sent to Copy Reviewer after creative completes
    When the Creative Generator finishes producing image, caption, and hashtags
    Then the system signals the Copy Reviewer agent to start
    And the signal includes the caption, hashtags, and campaign plan

  @ui
  Scenario: Timeline transitions to Reviewing after creative handoff
    When the Creative Generator completes and hands off
    Then the "Generating" timeline stage shows as "completed"
    And the "Reviewing" timeline stage shows as "active"

  # ---------------------------------------------------------------------------
  # FR-9: Error Handling — Retries on Transient Failure
  # ---------------------------------------------------------------------------

  @api
  Scenario: Transparent retry on transient image generation failure
    Given the image generation API will fail on the first attempt with a transient error
    And the image generation API will succeed on the second attempt
    When the Creative Generator attempts to generate an image
    Then the user sees only the successful creative result
    And no error message is displayed to the user

  @api
  Scenario: Error message and retry button after all 3 attempts fail
    Given the image generation API will fail on all 3 attempts
    When the Creative Generator attempts to generate an image
    Then an error message "Creative generation failed" is displayed in the chat
    And a "Retry" button is shown

  @ui
  Scenario: Retry button is visible and functional on generation failure
    Given image generation has failed after all retry attempts
    Then the chat shows an error message
    And a "Retry" button is visible
    When the user clicks the "Retry" button
    Then the Creative Generator re-runs from the beginning

  @api
  Scenario: Image preserved when caption generation fails separately
    Given image generation has completed successfully
    And caption generation fails after all 3 retry attempts
    Then the generated image is preserved
    And the error message is specific to caption generation
    And a "Retry" button is shown for text generation only

  @api
  Scenario: Exponential backoff between retry attempts
    Given the image generation API will fail on the first two attempts
    Then the delay between the first and second attempt is approximately 2 seconds
    And the delay between the second and third attempt is approximately 4 seconds
