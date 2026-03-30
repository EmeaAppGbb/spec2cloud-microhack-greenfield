# Campaign Timeline — Stage Progression Visualization

`@inc-01`

As a marketing user
  I want to see an ordered timeline of campaign stages
  So that I can track where my campaign is in the workflow

<details>
<summary><strong>📄 Gherkin Source</strong> — click to expand</summary>

```gherkin
@inc-01
Feature: Campaign Timeline — Stage Progression Visualization
  As a marketing user
  I want to see an ordered timeline of campaign stages
  So that I can track where my campaign is in the workflow

  Background:
    Given the application is loaded

  # ---------------------------------------------------------------------------
  # FR-1: Display Six Ordered Stages
  # ---------------------------------------------------------------------------

  @ui
  Scenario: All six stages are visible in correct order
    When the user views the timeline panel
    Then the following stages are displayed in order:
      | position | stage             |
      | 1        | Planning          |
      | 2        | Generating        |
      | 3        | Reviewing         |
      | 4        | Awaiting Approval |
      | 5        | Localizing        |
      | 6        | Complete          |

  @ui
  Scenario: All stages appear in pending state when no campaign is active
    Given no campaign is currently active
    When the user views the timeline panel
    Then all six stages appear in the "pending" visual state

  # ---------------------------------------------------------------------------
  # FR-2: Active Stage Highlight
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Planning stage is highlighted when planner agent starts
    Given the user has submitted a campaign brief
    When the planner agent starts processing
    Then the "Planning" stage is visually highlighted as active
    And only one stage is highlighted as active

  @ui
  Scenario: Generating stage is highlighted after Planning completes
    Given the planner agent has completed
    When the Creative Generator agent starts
    Then the "Planning" stage shows as completed
    And the "Generating" stage is visually highlighted as active
    And only one stage is highlighted as active

  @ui
  Scenario: No stage is highlighted when workflow is idle
    Given no campaign is currently active
    When the user views the timeline panel
    Then no stage is highlighted as active

  # ---------------------------------------------------------------------------
  # FR-3: Completed Stage Visual Distinction
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Completed stage shows checkmark and is visually distinct
    Given the planner agent has completed the "Planning" stage
    When the user views the timeline panel
    Then the "Planning" stage displays a completion indicator
    And the "Planning" stage is visually distinct from active stages
    And the "Planning" stage is visually distinct from pending stages

  @ui
  Scenario: Three visual states are distinguishable
    Given the planner agent has completed
    And the "Generating" stage is currently active
    When the user views the timeline panel
    Then the "Planning" stage appears in the "completed" visual state
    And the "Generating" stage appears in the "active" visual state
    And the "Reviewing" stage appears in the "pending" visual state
    And all three visual states are distinguishable from each other

  # ---------------------------------------------------------------------------
  # FR-4: Real-Time Updates on Stage Transition (Planning stage for inc-01)
  # ---------------------------------------------------------------------------

  @ui
  Scenario: Timeline updates in real time when transitioning from Planning to Generating
    Given the planner agent is actively processing a campaign
    When the workflow transitions from "Planning" to "Generating"
    Then the timeline updates within 1 second
    And no page refresh is required

  @ui
  Scenario: Timeline receives updates via SSE without page refresh
    Given the user is viewing the timeline panel
    When the backend pushes a stage-transition event
    Then the timeline updates to reflect the new stage
    And no page refresh is required

  @ui
  Scenario: Timeline syncs to correct state after network reconnection
    Given the user is viewing the timeline panel
    And the network connection drops during a stage transition
    When the network connection is restored
    Then the timeline syncs to the correct current stage state
```
</details>

---

## Scenarios

- [All six stages are visible in correct order](#all-six-stages-are-visible-in-correct-order)
- [All stages appear in pending state when no campaign is active](#all-stages-appear-in-pending-state-when-no-campaign-is-active)
- [Planning stage is highlighted when planner agent starts](#planning-stage-is-highlighted-when-planner-agent-starts)
- [Generating stage is highlighted after Planning completes](#generating-stage-is-highlighted-after-planning-completes)
- [No stage is highlighted when workflow is idle](#no-stage-is-highlighted-when-workflow-is-idle)
- [Completed stage shows checkmark and is visually distinct](#completed-stage-shows-checkmark-and-is-visually-distinct)
- [Three visual states are distinguishable](#three-visual-states-are-distinguishable)
- [Timeline updates in real time when transitioning from Planning to Generating](#timeline-updates-in-real-time-when-transitioning-from-planning-to-generating)
- [Timeline receives updates via SSE without page refresh](#timeline-receives-updates-via-sse-without-page-refresh)
- [Timeline syncs to correct state after network reconnection](#timeline-syncs-to-correct-state-after-network-reconnection)

---

## All six stages are visible in correct order {#all-six-stages-are-visible-in-correct-order}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **When** the user views the timeline panel
- **Then** the following stages are displayed in order:

---

## All stages appear in pending state when no campaign is active {#all-stages-appear-in-pending-state-when-no-campaign-is-active}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** no campaign is currently active
- **When** the user views the timeline panel
- **Then** all six stages appear in the "pending" visual state

---

## Planning stage is highlighted when planner agent starts {#planning-stage-is-highlighted-when-planner-agent-starts}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the user has submitted a campaign brief
- **When** the planner agent starts processing
- **Then** the "Planning" stage is visually highlighted as active
- **And** only one stage is highlighted as active

---

## Generating stage is highlighted after Planning completes {#generating-stage-is-highlighted-after-planning-completes}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the planner agent has completed
- **When** the Creative Generator agent starts
- **Then** the "Planning" stage shows as completed
- **And** the "Generating" stage is visually highlighted as active
- **And** only one stage is highlighted as active

---

## No stage is highlighted when workflow is idle {#no-stage-is-highlighted-when-workflow-is-idle}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** no campaign is currently active
- **When** the user views the timeline panel
- **Then** no stage is highlighted as active

---

## Completed stage shows checkmark and is visually distinct {#completed-stage-shows-checkmark-and-is-visually-distinct}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the planner agent has completed the "Planning" stage
- **When** the user views the timeline panel
- **Then** the "Planning" stage displays a completion indicator
- **And** the "Planning" stage is visually distinct from active stages
- **And** the "Planning" stage is visually distinct from pending stages

---

## Three visual states are distinguishable {#three-visual-states-are-distinguishable}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the planner agent has completed
- **And** the "Generating" stage is currently active
- **When** the user views the timeline panel
- **Then** the "Planning" stage appears in the "completed" visual state
- **And** the "Generating" stage appears in the "active" visual state
- **And** the "Reviewing" stage appears in the "pending" visual state
- **And** all three visual states are distinguishable from each other

---

## Timeline updates in real time when transitioning from Planning to Generating {#timeline-updates-in-real-time-when-transitioning-from-planning-to-generating}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the planner agent is actively processing a campaign
- **When** the workflow transitions from "Planning" to "Generating"
- **Then** the timeline updates within 1 second
- **And** no page refresh is required

---

## Timeline receives updates via SSE without page refresh {#timeline-receives-updates-via-sse-without-page-refresh}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the user is viewing the timeline panel
- **When** the backend pushes a stage-transition event
- **Then** the timeline updates to reflect the new stage
- **And** no page refresh is required

---

## Timeline syncs to correct state after network reconnection {#timeline-syncs-to-correct-state-after-network-reconnection}

`@ui`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the user is viewing the timeline panel
- **And** the network connection drops during a stage transition
- **When** the network connection is restored
- **Then** the timeline syncs to the correct current stage state

---
