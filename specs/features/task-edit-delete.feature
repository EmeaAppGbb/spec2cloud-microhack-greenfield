@tasks @edit @delete
Feature: Task Edit and Delete
  As an authenticated user, I want to edit and delete tasks
  so that I can update or remove items from my board.

  # ── PRD traceability: US-10 (Edit), US-11 (Delete) ──

  Background:
    Given a registered user "edituser" with password "SecurePass1"
    And the user is logged in
    And the user has created a task with title "Original title" and description "Original description"

  # ── Edit Scenarios (US-10) ──

  @smoke
  Scenario: Edit task title successfully
    When the user updates the task title to "Updated title"
    Then the response status is 200
    And the response contains a task with title "Updated title"
    And the task description is "Original description"

  Scenario: Edit task description successfully
    When the user updates the task description to "Updated description"
    Then the response status is 200
    And the task description is "Updated description"
    And the response contains a task with title "Original title"

  Scenario: Edit both title and description
    When the user updates the task title to "New title" and description to "New description"
    Then the response status is 200
    And the response contains a task with title "New title"
    And the task description is "New description"

  Scenario: Cannot save empty title — returns 400
    When the user updates the task title to ""
    Then the response status is 400
    And the response error is "Title is required"

  Scenario: Cannot save whitespace-only title — returns 400
    When the user updates the task title to "   "
    Then the response status is 400
    And the response error is "Title is required"

  Scenario: Cannot save title exceeding 120 characters — returns 400
    When the user updates the task with a title of 121 characters
    Then the response status is 400
    And the response error is "Title must be 120 characters or fewer"

  Scenario: Cannot edit another user's task — returns 404
    Given a second registered user "otheruser2" with password "SecurePass2"
    And "otheruser2" is logged in
    When "otheruser2" updates the task title to "Hijacked"
    Then the response status is 404
    And the response error is "Task not found"

  Scenario: Cancel edit discards changes
    When the user enters edit mode for the task
    And the user changes the title to "Discarded title"
    And the user cancels the edit
    Then the task title remains "Original title"

  Scenario: Edit requires authentication — 401 when not authenticated
    Given the user is not authenticated
    When the user updates the task title to "No auth edit"
    Then the response status is 401
    And the response error is "Not authenticated"

  # ── Delete Scenarios (US-11) ──

  @smoke
  Scenario: Delete task successfully — returns 204
    When the user deletes the task
    Then the response status is 204

  Scenario: Confirmation prompt before deletion
    When the user clicks the delete button for the task
    Then a confirmation dialog is shown with text "Are you sure you want to delete this task?"

  Scenario: Task disappears from board after deletion
    When the user deletes the task
    And the user requests their task list
    Then the task "Original title" does not appear in the list

  Scenario: Cannot delete another user's task — returns 404
    Given a second registered user "delother" with password "SecurePass2"
    And "delother" is logged in
    When "delother" deletes the task
    Then the response status is 404
    And the response error is "Task not found"

  Scenario: Deleting non-existent task — returns 404
    When the user deletes a task with id "00000000-0000-0000-0000-000000000000"
    Then the response status is 404
    And the response error is "Task not found"

  Scenario: Delete requires authentication — 401 when not authenticated
    Given the user is not authenticated
    When the user deletes the task
    Then the response status is 401
    And the response error is "Not authenticated"
