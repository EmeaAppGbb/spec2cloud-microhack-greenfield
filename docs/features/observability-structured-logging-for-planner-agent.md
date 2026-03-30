# Observability — Structured Logging for Planner Agent

`@inc-01`

As an operations engineer
  I want structured JSON logs for all planner agent actions
  So that I can monitor, debug, and trace campaign processing

<details>
<summary><strong>📄 Gherkin Source</strong> — click to expand</summary>

```gherkin
@inc-01
Feature: Observability — Structured Logging for Planner Agent
  As an operations engineer
  I want structured JSON logs for all planner agent actions
  So that I can monitor, debug, and trace campaign processing

  # ---------------------------------------------------------------------------
  # FR-1: Structured Logging for Planner Agent Actions
  # ---------------------------------------------------------------------------

  @api
  Scenario: Agent start is logged with structured JSON
    Given a campaign brief has been submitted
    When the planner agent starts execution
    Then a structured JSON log entry is written to stdout
    And the log entry has level "info"
    And the log entry contains "agentName" set to "planner"
    And the log entry contains "action" set to "start"

  @api
  Scenario: Agent completion is logged with duration
    Given the planner agent is processing a campaign
    When the planner agent completes execution
    Then a structured JSON log entry is written to stdout
    And the log entry has level "info"
    And the log entry contains "agentName" set to "planner"
    And the log entry contains "action" set to "complete"
    And the log entry contains a "durationMs" field with a positive number

  @api
  Scenario: Retry attempt is logged at warn level
    Given the LLM call fails on the first attempt
    When the planner agent retries the LLM call
    Then a structured JSON log entry is written to stdout
    And the log entry has level "warn"
    And the log entry contains "agentName" set to "planner"
    And the log entry contains "action" set to "retry"
    And the log entry contains "attempt" with the current attempt number

  @api
  Scenario: Final failure is logged at error level
    Given all 3 LLM attempts have failed
    When the final failure is recorded
    Then a structured JSON log entry is written to stdout
    And the log entry has level "error"
    And the log entry contains "agentName" set to "planner"
    And the log entry contains "action" set to "error"
    And the log entry contains an "errorType" field

  # ---------------------------------------------------------------------------
  # FR-8: Log Format and Structure Requirements
  # ---------------------------------------------------------------------------

  @api
  Scenario: Log entries are single-line JSON on stdout
    Given the application is running
    When any log entry is produced
    Then the log entry is a valid single-line JSON object
    And the log entry is written to stdout

  @api
  Scenario: Log level filtering respects LOG_LEVEL environment variable
    Given the environment variable "LOG_LEVEL" is set to "warn"
    When an info-level event occurs in the planner agent
    Then the info-level event is not written to stdout

  @api
  Scenario: Campaign context is included in log entries
    Given a campaign with a known campaign ID is active
    When the planner agent produces a log entry
    Then the log entry contains a "campaignId" field
    And the log entry contains a "traceId" field

  @api
  Scenario: Sensitive data is excluded from log entries
    Given the user has submitted a campaign brief
    When the planner agent produces log entries
    Then no log entry contains API keys or secrets
    And no log entry contains the full user brief text

  @api
  Scenario: No console.log statements in production source code
    Given the API source code in "src/api/"
    When the source files are scanned
    Then no file contains a "console.log" statement
```
</details>

---

## Scenarios

- [Agent start is logged with structured JSON](#agent-start-is-logged-with-structured-json)
- [Agent completion is logged with duration](#agent-completion-is-logged-with-duration)
- [Retry attempt is logged at warn level](#retry-attempt-is-logged-at-warn-level)
- [Final failure is logged at error level](#final-failure-is-logged-at-error-level)
- [Log entries are single-line JSON on stdout](#log-entries-are-single-line-json-on-stdout)
- [Log level filtering respects LOG_LEVEL environment variable](#log-level-filtering-respects-log-level-environment-variable)
- [Campaign context is included in log entries](#campaign-context-is-included-in-log-entries)
- [Sensitive data is excluded from log entries](#sensitive-data-is-excluded-from-log-entries)
- [No console.log statements in production source code](#no-console-log-statements-in-production-source-code)

---

## Agent start is logged with structured JSON {#agent-start-is-logged-with-structured-json}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** a campaign brief has been submitted
- **When** the planner agent starts execution
- **Then** a structured JSON log entry is written to stdout
- **And** the log entry has level "info"
- **And** the log entry contains "agentName" set to "planner"
- **And** the log entry contains "action" set to "start"

---

## Agent completion is logged with duration {#agent-completion-is-logged-with-duration}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the planner agent is processing a campaign
- **When** the planner agent completes execution
- **Then** a structured JSON log entry is written to stdout
- **And** the log entry has level "info"
- **And** the log entry contains "agentName" set to "planner"
- **And** the log entry contains "action" set to "complete"
- **And** the log entry contains a "durationMs" field with a positive number

---

## Retry attempt is logged at warn level {#retry-attempt-is-logged-at-warn-level}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the LLM call fails on the first attempt
- **When** the planner agent retries the LLM call
- **Then** a structured JSON log entry is written to stdout
- **And** the log entry has level "warn"
- **And** the log entry contains "agentName" set to "planner"
- **And** the log entry contains "action" set to "retry"
- **And** the log entry contains "attempt" with the current attempt number

---

## Final failure is logged at error level {#final-failure-is-logged-at-error-level}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** all 3 LLM attempts have failed
- **When** the final failure is recorded
- **Then** a structured JSON log entry is written to stdout
- **And** the log entry has level "error"
- **And** the log entry contains "agentName" set to "planner"
- **And** the log entry contains "action" set to "error"
- **And** the log entry contains an "errorType" field

---

## Log entries are single-line JSON on stdout {#log-entries-are-single-line-json-on-stdout}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the application is running
- **When** any log entry is produced
- **Then** the log entry is a valid single-line JSON object
- **And** the log entry is written to stdout

---

## Log level filtering respects LOG_LEVEL environment variable {#log-level-filtering-respects-log-level-environment-variable}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the environment variable "LOG_LEVEL" is set to "warn"
- **When** an info-level event occurs in the planner agent
- **Then** the info-level event is not written to stdout

---

## Campaign context is included in log entries {#campaign-context-is-included-in-log-entries}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** a campaign with a known campaign ID is active
- **When** the planner agent produces a log entry
- **Then** the log entry contains a "campaignId" field
- **And** the log entry contains a "traceId" field

---

## Sensitive data is excluded from log entries {#sensitive-data-is-excluded-from-log-entries}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the user has submitted a campaign brief
- **When** the planner agent produces log entries
- **Then** no log entry contains API keys or secrets
- **And** no log entry contains the full user brief text

---

## No console.log statements in production source code {#no-console-log-statements-in-production-source-code}

`@api`

!!! note "Screenshots not yet captured"
    Run the test suite to generate step-by-step screenshots.

- **Given** the API source code in "src/api/"
- **When** the source files are scanned
- **Then** no file contains a "console.log" statement

---
