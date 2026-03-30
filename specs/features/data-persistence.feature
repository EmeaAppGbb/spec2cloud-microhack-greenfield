@inc-01
Feature: Data Persistence — Planning Stage
  As a marketing user
  I want my campaign brief and plan to be saved after planning completes
  So that my work is not lost and can be retrieved later

  # ---------------------------------------------------------------------------
  # FR-1: Persist Campaign Data at Planning Stage Transition
  # ---------------------------------------------------------------------------

  @api
  Scenario: Brief and plan are persisted after planner completes
    Given the user has submitted the brief "Launch a summer fitness campaign targeting millennials"
    When the planner completes and generates a plan
    Then the campaign record is persisted
    And the persisted record contains the original brief "Launch a summer fitness campaign targeting millennials"
    And the persisted record contains the structured plan with all seven fields
    And the persisted record contains a "createdAt" timestamp
    And the persisted record contains an "updatedAt" timestamp

  @api
  Scenario: Persisted campaign can be retrieved by ID
    Given a campaign has been created with the brief "Launch a summer fitness campaign"
    And the planner has completed and the data is persisted
    When the campaign plan is retrieved by campaign ID
    Then the response contains the complete plan
    And the plan contains all seven CampaignPlan fields

  @api
  Scenario: Workflow does not advance when persistence fails
    Given the user has submitted a campaign brief
    And the persistence layer is experiencing an error
    When the planner completes and attempts to persist the plan
    Then an error message is displayed to the user
    And a retry option is available
    And the workflow does not advance to the "Generating" stage

  @api
  Scenario: Campaign ID is returned on creation
    When the user submits the brief "Launch a summer fitness campaign"
    Then a campaign ID is returned in the response
    And the campaign ID is a non-empty string
