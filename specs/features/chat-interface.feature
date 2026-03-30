@inc-01
Feature: Chat Interface — Split Panel with Streaming
  As a marketing user
  I want a split-panel chat interface with streaming responses
  So that I can interact with the AI planner and see progress in real time

  # ---------------------------------------------------------------------------
  # FR-1: Split-Panel Layout
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Split-panel layout renders on wide viewport
    Given the application is loaded in a wide viewport
    When the page renders
    Then a left chat panel is displayed
    And a right timeline panel is displayed side by side

  @ui
  Scenario: Panels stack vertically on narrow viewport
    Given the application is loaded in a narrow viewport
    When the page renders
    Then the chat panel is displayed on top
    And the timeline panel is displayed below the chat panel

  # ---------------------------------------------------------------------------
  # FR-2: Message Input and Submission
  # ---------------------------------------------------------------------------

  @ui
  Scenario: User submits a non-empty message with Enter key
    Given the chat is idle
    And the user has typed "Launch a summer fitness campaign targeting millennials"
    When the user presses Enter
    Then the message "Launch a summer fitness campaign targeting millennials" appears in the chat history
    And the campaign pipeline starts

  @ui
  Scenario: Submit is disabled when input is empty
    Given the chat is idle
    And the message input is empty
    When the user presses Enter
    Then no message is sent
    And the chat history remains unchanged

  @ui
  Scenario: Shift+Enter inserts a newline instead of submitting
    Given the chat is idle
    And the user has typed "First line"
    When the user presses Shift+Enter
    And the user types "Second line"
    Then the input contains a newline between "First line" and "Second line"
    And no message is sent

  @ui
  Scenario: Input is disabled while the pipeline is active
    Given the user has submitted "Launch a summer fitness campaign"
    And the pipeline is actively processing
    When the user attempts to type in the message input
    Then the message input is disabled
    And no new message can be submitted

  # ---------------------------------------------------------------------------
  # FR-3: Token-by-Token Streaming
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Text tokens appear progressively in chat
    Given the user has submitted "Launch a summer fitness campaign"
    When the planner agent streams its response
    Then text tokens appear progressively in the assistant message
    And the response is not delivered as a single block

  @ui
  Scenario: Chat auto-scrolls to latest content when user has not scrolled up
    Given the user has submitted a brief
    And the user has not scrolled up from the bottom
    When new tokens arrive from the streaming response
    Then the chat auto-scrolls to show the latest content

  @ui
  Scenario: Auto-scroll pauses when user scrolls up
    Given the user has submitted a brief
    And the planner agent is streaming its response
    When the user scrolls up in the chat panel
    Then auto-scroll is paused
    And a "scroll to bottom" indicator appears

  # ---------------------------------------------------------------------------
  # FR-5: Structured Data Atomic Delivery
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Explanatory text streams then plan block appears atomically
    Given the user has submitted "Launch a summer fitness campaign targeting millennials"
    When the planner agent produces its response
    Then explanatory text streams token-by-token first
    And then the structured campaign plan appears all at once as a single block

  @ui
  Scenario: Plan block displays all seven fields
    Given the planner has generated a plan for "Launch a summer fitness campaign"
    When the structured plan block renders
    Then the plan block displays the "campaignName" field
    And the plan block displays the "objective" field
    And the plan block displays the "targetAudience" field
    And the plan block displays the "keyMessages" field
    And the plan block displays the "visualDirection" field
    And the plan block displays the "tone" field
    And the plan block displays the "platform" field
