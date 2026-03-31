@rbac @admin
Feature: Role-Based Access Control
  As an administrator, I want to access an admin dashboard
  so that I can view all registered users.

  # Covers US-4 (Role-Based Access) from FRD-RBAC

  # ── API-level role assignment ────────────────────────────────────

  @smoke
  Scenario: First registered user gets admin role
    Given the user store is empty
    When I register with username "firstuser" and password "SecurePass1!"
    Then the response status should be 201
    And the response JSON should include role "admin"
    And the JWT payload should include role "admin"

  Scenario: Subsequent users get user role
    Given the user store is empty
    And a registered admin "existingadmin" with password "SecurePass1!"
    When I register with username "seconduser" and password "SecurePass1!"
    Then the response status should be 201
    And the response JSON should include role "user"
    And the JWT payload should include role "user"

  # ── API-level admin users endpoint ───────────────────────────────

  Scenario: Admin user list excludes passwords and IDs
    Given the user store is empty
    And a registered admin "secureadmin" with password "SecurePass1!"
    And a registered user "regularuser" with password "SecurePass1!"
    And I am logged in as "secureadmin" with password "SecurePass1!"
    When I send a GET request to "/api/admin/users"
    Then the response status should be 200
    And the response should be a JSON array with 2 entries
    And each entry should have "username", "role", and "createdAt" fields
    And no entry should have a "passwordHash" field
    And no entry should have an "id" field

  Scenario: Response includes admin's own entry
    Given the user store is empty
    And a registered admin "selfadmin" with password "SecurePass1!"
    And I am logged in as "selfadmin" with password "SecurePass1!"
    When I send a GET request to "/api/admin/users"
    Then the response status should be 200
    And the response should be a JSON array with 1 entries
    And each entry should have "username", "role", and "createdAt" fields

  # ── UI-level admin dashboard ─────────────────────────────────────

  @smoke
  Scenario: Admin can access /admin and see user table
    Given the user store is empty
    And a registered admin "tableadmin" with password "SecurePass1!"
    And a registered user "tableuser" with password "SecurePass1!"
    And I am logged in as "tableadmin" with password "SecurePass1!"
    When I visit the "/admin" page
    Then I should see a table with columns "Username", "Role", and "Member Since"
    And the table should contain a row with username "tableadmin" and role "admin"
    And the table should contain a row with username "tableuser" and role "user"

  Scenario: Admin sees all registered users with username, role, member-since
    Given the user store is empty
    And a registered admin "detailadmin" with password "SecurePass1!"
    And a registered user "detailuser" with password "SecurePass1!"
    And I am logged in as "detailadmin" with password "SecurePass1!"
    When I visit the "/admin" page
    Then I should see a table with columns "Username", "Role", and "Member Since"
    And the table should contain a row with username "detailadmin" and role "admin"
    And the table should contain a row with username "detailuser" and role "user"

  Scenario: Non-admin user sees 403 Forbidden page on /admin
    Given the user store is empty
    And a registered admin "blockedadmin" with password "SecurePass1!"
    And a registered user "blockeduser" with password "SecurePass1!"
    And I am logged in as "blockeduser" with password "SecurePass1!"
    When I visit the "/admin" page
    Then I should see the heading "403 Forbidden"
    And I should see the text "You do not have permission to view this page."

  Scenario: Unauthenticated user is redirected from /admin to /login
    Given I am not authenticated
    When I visit the "/admin" page
    Then I should be redirected to "/login"
