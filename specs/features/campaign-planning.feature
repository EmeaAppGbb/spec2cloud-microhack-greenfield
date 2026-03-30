@inc-01
Feature: Campaign Planning Agent
  As a marketing user
  I want to submit a free-text brief and receive a structured campaign plan
  So that I can quickly outline a campaign without manual planning work

  Background:
    Given the application is loaded
    And no campaign is currently active

  # ---------------------------------------------------------------------------
  # FR-1: Accept Free-Text Brief
  # ---------------------------------------------------------------------------

  @api
  Scenario: Planner receives the full brief text
    When the user submits the brief "Launch a summer fitness campaign targeting millennials"
    Then the planner receives the full text "Launch a summer fitness campaign targeting millennials"

  @api
  Scenario: Leading and trailing whitespace is trimmed from brief
    When the user submits the brief "  Launch a summer fitness campaign  "
    Then the planner receives the trimmed text "Launch a summer fitness campaign"

  # ---------------------------------------------------------------------------
  # FR-2: Empty/Short Brief Validation
  # ---------------------------------------------------------------------------

  @api
  Scenario: Empty brief is rejected with a prompt message
    When the user submits an empty brief ""
    Then a prompt message is displayed asking the user to describe their campaign
    And the campaign pipeline does not start

  @api
  Scenario: Brief shorter than 10 characters is rejected
    When the user submits the brief "Hi"
    Then a "too short" validation message is displayed
    And the campaign pipeline does not start

  @api
  Scenario: Brief with exactly 9 characters is rejected
    When the user submits the brief "Campaign!"
    Then a "too short" validation message is displayed
    And the campaign pipeline does not start

  @api
  Scenario: Brief with exactly 10 characters is accepted
    When the user submits the brief "Summer ads"
    Then the brief is accepted
    And the campaign planning begins

  @api
  Scenario: Brief with 13 characters is accepted
    When the user submits the brief "Launch summer"
    Then the brief is accepted
    And the campaign planning begins

  # ---------------------------------------------------------------------------
  # FR-3: Brief Length Limit
  # ---------------------------------------------------------------------------

  @api
  Scenario: Brief exceeding 2000 characters is truncated with notification
    Given the user has composed a brief that is 2500 characters long
    When the user submits the brief
    Then only the first 2000 characters of the brief are used for planning
    And the user is notified that the brief was truncated

  @api
  Scenario: Brief within limit is used in full without truncation
    Given the user has composed a brief that is 1999 characters long
    When the user submits the brief
    Then the full brief is used for planning
    And no truncation notification is shown

  @api
  Scenario: Brief at exactly 2000 characters is used in full
    Given the user has composed a brief that is exactly 2000 characters long
    When the user submits the brief
    Then the full brief is used for planning
    And no truncation notification is shown

  # ---------------------------------------------------------------------------
  # FR-4: Structured Plan Generation
  # ---------------------------------------------------------------------------

  @api
  Scenario: Plan contains all seven required fields
    When the user submits the brief "Launch a summer fitness campaign targeting millennials"
    And the planner generates a plan
    Then the plan contains a non-empty "campaignName"
    And the plan contains a non-empty "objective"
    And the plan contains a non-empty "targetAudience"
    And the plan contains a non-empty "keyMessages" list
    And the plan contains a non-empty "visualDirection"
    And the plan contains a non-empty "tone"
    And the plan contains a non-empty "platform"

  @api
  Scenario: Key messages list is padded to minimum of 2 items
    Given the LLM returns a plan with only 1 key message
    When the plan is validated
    Then the "keyMessages" list contains at least 2 items

  @api
  Scenario: Key messages list is capped at maximum of 5 items
    Given the LLM returns a plan with 7 key messages
    When the plan is validated
    Then the "keyMessages" list contains exactly 5 items

  @api
  Scenario: Key messages within valid range are unchanged
    Given the LLM returns a plan with 3 key messages
    When the plan is validated
    Then the "keyMessages" list contains exactly 3 items

  # ---------------------------------------------------------------------------
  # FR-5: Smart Defaults
  # ---------------------------------------------------------------------------

  @api
  Scenario: Defaults applied when brief does not specify platform, audience, or tone
    When the user submits the brief "Promote our new coffee blend"
    And the planner generates a plan
    Then the plan "platform" is "Instagram"
    And the plan "targetAudience" is "General audience"
    And the plan "tone" is "Professional"
    And the response indicates defaults were applied for "platform"
    And the response indicates defaults were applied for "targetAudience"
    And the response indicates defaults were applied for "tone"

  @api
  Scenario: Explicit values in brief override smart defaults
    When the user submits the brief "Create a playful TikTok campaign for Gen Z"
    And the planner generates a plan
    Then the plan "platform" is not "Instagram"
    And the plan "targetAudience" reflects "Gen Z"
    And the plan "tone" reflects "playful"

  @api
  Scenario: Partial defaults applied when only some values are specified
    When the user submits the brief "Launch a LinkedIn campaign for our enterprise product"
    And the planner generates a plan
    Then the plan "platform" is not "Instagram"
    And the plan "targetAudience" is not "General audience"
    And the plan "tone" is "Professional"
    And the response indicates defaults were applied for "tone"

  # ---------------------------------------------------------------------------
  # FR-6: Markdown Output Format
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Explanatory text streams followed by atomic plan block
    When the user submits the brief "Launch a summer fitness campaign targeting millennials"
    And the planner produces its response
    Then explanatory text is streamed token-by-token in the chat
    And after the text completes the structured plan block appears atomically
    And the plan block displays all seven fields in formatted markdown

  @api
  Scenario: SSE stream delivers tokens then structured plan event
    When the user submits the brief "Launch a summer fitness campaign"
    And the client subscribes to the campaign stream
    Then the stream emits "token" events for explanatory text
    And the stream emits a "structured" event containing the complete plan
    And the "structured" event contains all seven CampaignPlan fields

  # ---------------------------------------------------------------------------
  # FR-7: Auto-Handoff to Creative Generator
  # ---------------------------------------------------------------------------

  @api
  Scenario: Planner signals handoff to Creative Generator after plan completion
    Given the user has submitted the brief "Launch a summer fitness campaign"
    When the planner completes and the plan is displayed
    Then the system signals the Creative Generator agent to start
    And a "stage-transition" event is emitted for the "generating" stage

  @ui
  Scenario: Timeline updates from Planning to Generating on handoff
    Given the user has submitted the brief "Launch a summer fitness campaign"
    When the planner completes its work
    Then the "Planning" stage shows as completed on the timeline
    And the "Generating" stage shows as active on the timeline

  # ---------------------------------------------------------------------------
  # FR-8: LLM Failure Handling with Retries
  # ---------------------------------------------------------------------------

  @api
  Scenario: Transparent retry on first LLM failure
    Given the LLM call will fail on the first attempt
    And the LLM call will succeed on the second attempt
    When the user submits the brief "Launch a summer fitness campaign"
    Then the user sees only the successful plan result
    And no error message is displayed to the user

  @api
  Scenario: Transparent retry on second LLM failure
    Given the LLM call will fail on the first and second attempts
    And the LLM call will succeed on the third attempt
    When the user submits the brief "Launch a summer fitness campaign"
    Then the user sees only the successful plan result
    And no error message is displayed to the user

  @api
  Scenario: Error and retry button after all 3 attempts fail
    Given the LLM call will fail on all 3 attempts
    When the user submits the brief "Launch a summer fitness campaign"
    Then an error message is displayed in the chat
    And a "Retry" button is shown

  @ui
  Scenario: Retry button reuses the original brief
    Given the LLM call has failed on all 3 attempts
    And the user sees an error message with a "Retry" button
    When the user clicks the "Retry" button
    Then the planner re-runs using the same original brief "Launch a summer fitness campaign"
    And the retry counter resets to allow 3 fresh attempts
