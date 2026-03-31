@tasks @create
Feature: Task Management — Create
  As an authenticated user, I want to create tasks
  so that I can track work I need to do.

  # ── PRD traceability: US-7 ──

  Background:
    Given a registered user "taskuser" with password "SecurePass1"
    And the user is logged in

  @smoke
  Scenario: Create a task with title only
    When the user creates a task with title "Buy groceries"
    Then the response status is 201
    And the response contains a task with title "Buy groceries"
    And the task description is ""
    And the task status is "todo"

  Scenario: Create a task with title and description
    When the user creates a task with title "Plan sprint" and description "Review backlog items"
    Then the response status is 201
    And the response contains a task with title "Plan sprint"
    And the task description is "Review backlog items"
    And the task status is "todo"

  @smoke
  Scenario: New task appears with status "todo"
    When the user creates a task with title "Write tests"
    Then the response status is 201
    And the task status is "todo"

  Scenario: Task response includes all required fields
    When the user creates a task with title "Check response fields"
    Then the response status is 201
    And the response contains field "id"
    And the response contains field "title"
    And the response contains field "description"
    And the response contains field "status"
    And the response contains field "createdAt"
    And the response does not contain field "userId"

  Scenario: Title is required — empty title returns error
    When the user creates a task with title ""
    Then the response status is 400
    And the response error is "Title is required"

  Scenario: Whitespace-only title is rejected
    When the user creates a task with title "   "
    Then the response status is 400
    And the response error is "Title is required"

  Scenario: Title max 120 characters — 121 chars returns error
    When the user creates a task with a title of 121 characters
    Then the response status is 400
    And the response error is "Title must be 120 characters or fewer"

  Scenario: Title exactly 120 characters is accepted
    When the user creates a task with a title of 120 characters
    Then the response status is 201
    And the response contains a task with a 120-character title

  Scenario: Unauthenticated user gets 401
    Given the user is not authenticated
    When the user creates a task with title "Should fail"
    Then the response status is 401
    And the response error is "Not authenticated"

  Scenario: Created task belongs to the authenticated user
    Given a second registered user "otheruser" with password "SecurePass2"
    When "taskuser" creates a task with title "My private task"
    And "otheruser" requests their task list
    Then the task "My private task" does not appear in the list
