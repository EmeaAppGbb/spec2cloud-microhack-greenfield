@tasks @board
Feature: Task Board — View and Move
  As an authenticated user, I want to see my tasks organized in columns
  and move them between statuses.

  # ── PRD traceability: US-8 (View Board), US-9 (Move Task) ──

  Background:
    Given a registered user "boarduser" with password "SecurePass1"
    And the user is logged in

  # ── View Board scenarios (US-8) ──

  @smoke
  Scenario: Board shows three columns — To Do, In Progress, Done
    When the user views the board
    Then the board has a "To Do" column
    And the board has an "In Progress" column
    And the board has a "Done" column

  Scenario: Empty board shows three columns with count 0
    When the user views the board
    Then the "To Do" column shows count 0
    And the "In Progress" column shows count 0
    And the "Done" column shows count 0

  Scenario: Each column shows task count
    Given the user has created the following tasks:
      | title          |
      | Task Alpha     |
      | Task Beta      |
      | Task Gamma     |
    And the user has moved "Task Beta" to "in_progress"
    When the user views the board
    Then the "To Do" column shows count 2
    And the "In Progress" column shows count 1
    And the "Done" column shows count 0

  Scenario: Tasks are ordered by createdAt ascending (oldest first)
    Given the user has created the following tasks in order:
      | title    |
      | First    |
      | Second   |
      | Third    |
    When the user views the board
    Then the "To Do" column lists tasks in order: "First", "Second", "Third"

  Scenario: Only authenticated user's tasks are shown
    Given a second registered user "otherboarduser" with password "SecurePass2"
    And "otherboarduser" has created a task with title "Other user task"
    When "boarduser" views the board
    Then the task "Other user task" does not appear on the board

  Scenario: Unauthenticated user gets 401 on task list
    Given the user is not authenticated
    When the user requests their task list
    Then the response status is 401
    And the response error is "Not authenticated"

  @smoke
  Scenario: Task card shows title and truncated description
    Given the user has created a task with title "My Task" and description "This is a description that should be visible on the card"
    When the user views the board
    Then the task "My Task" appears in the "To Do" column
    And the task card displays the title "My Task"
    And the task card displays the description

  # ── Move Task scenarios (US-9) ──

  @smoke
  Scenario: Move task from To Do to In Progress
    Given the user has created a task with title "Move me forward"
    When the user moves "Move me forward" to status "in_progress"
    Then the response status is 200
    And the task "Move me forward" has status "in_progress"

  Scenario: Move task from In Progress to Done
    Given the user has created a task with title "Almost done"
    And the user has moved "Almost done" to "in_progress"
    When the user moves "Almost done" to status "done"
    Then the response status is 200
    And the task "Almost done" has status "done"

  Scenario: Move task from In Progress back to To Do
    Given the user has created a task with title "Go back"
    And the user has moved "Go back" to "in_progress"
    When the user moves "Go back" to status "todo"
    Then the response status is 200
    And the task "Go back" has status "todo"

  Scenario: Move task from Done back to In Progress
    Given the user has created a task with title "Reopen me"
    And the user has moved "Reopen me" to "in_progress"
    And the user has moved "Reopen me" to "done"
    When the user moves "Reopen me" to status "in_progress"
    Then the response status is 200
    And the task "Reopen me" has status "in_progress"

  @smoke
  Scenario: Cannot move task from To Do directly to Done
    Given the user has created a task with title "No skipping"
    When the user moves "No skipping" to status "done"
    Then the response status is 400
    And the response error is "Invalid status transition"

  Scenario: Cannot move task from Done directly to To Do
    Given the user has created a task with title "No reverse skip"
    And the user has moved "No reverse skip" to "in_progress"
    And the user has moved "No reverse skip" to "done"
    When the user moves "No reverse skip" to status "todo"
    Then the response status is 400
    And the response error is "Invalid status transition"

  Scenario: Moving updates the board — column counts change
    Given the user has created the following tasks:
      | title       |
      | Count task  |
    When the user moves "Count task" to status "in_progress"
    And the user views the board
    Then the "To Do" column shows count 0
    And the "In Progress" column shows count 1

  Scenario: Column counts update after move to done
    Given the user has created a task with title "Track counts"
    And the user has moved "Track counts" to "in_progress"
    When the user moves "Track counts" to status "done"
    And the user views the board
    Then the "In Progress" column shows count 0
    And the "Done" column shows count 1

  Scenario: Cannot move another user's task — returns 404
    Given a second registered user "sneakyuser" with password "SecurePass2"
    And "boarduser" has created a task with title "Private task"
    When "sneakyuser" tries to move the task "Private task" to status "in_progress"
    Then the response status is 404
    And the response error is "Task not found"
