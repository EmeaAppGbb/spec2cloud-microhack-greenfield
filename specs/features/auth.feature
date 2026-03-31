@auth
Feature: User Authentication
  As a user, I want to register, log in, and log out
  so that I can access and secure my task board.

  # ────────────────────────────────────────────
  # Registration (US-1)
  # ────────────────────────────────────────────

  @register @smoke
  Scenario: Successful registration with valid credentials
    Given I am on the registration page
    When I fill in "username" with "testuser"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should be redirected to "/login"
    And I should see the success message "Registration successful. Please log in."

  @register
  Scenario: Registration button shows loading state during submission
    Given I am on the registration page
    When I fill in "username" with "newuser1"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then the "Register" button should be disabled
    And the "Register" button should show "Registering…"

  # --- Username validation (frd-auth §3.1, §3.3 — validated first) ---

  @register
  Scenario: Registration fails when username is empty
    Given I am on the registration page
    When I fill in "username" with ""
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username is required"
    And I should remain on the registration page

  @register
  Scenario: Registration fails when username is whitespace only
    Given I am on the registration page
    When I fill in "username" with "   "
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores"
    And I should remain on the registration page

  @register
  Scenario: Registration fails when username is too short
    Given I am on the registration page
    When I fill in "username" with "ab"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores"
    And I should remain on the registration page

  @register
  Scenario: Registration succeeds with username at minimum length boundary
    Given I am on the registration page
    When I fill in "username" with "abc"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should be redirected to "/login"
    And I should see the success message "Registration successful. Please log in."

  @register
  Scenario: Registration succeeds with username at maximum length boundary
    Given I am on the registration page
    When I fill in "username" with "abcdefghijklmnopqrstuvwxyz1234"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should be redirected to "/login"
    And I should see the success message "Registration successful. Please log in."

  @register
  Scenario: Registration fails when username exceeds maximum length
    Given I am on the registration page
    When I fill in "username" with "abcdefghijklmnopqrstuvwxyz12345"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores"
    And I should remain on the registration page

  @register
  Scenario: Registration fails when username contains special characters
    Given I am on the registration page
    When I fill in "username" with "test@user!"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores"
    And I should remain on the registration page

  @register
  Scenario: Registration fails when username contains spaces
    Given I am on the registration page
    When I fill in "username" with "test user"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores"
    And I should remain on the registration page

  @register
  Scenario: Registration succeeds with username containing underscores
    Given I am on the registration page
    When I fill in "username" with "test_user_1"
    And I fill in "password" with "secureP@ss1"
    And I click the "Register" button
    Then I should be redirected to "/login"
    And I should see the success message "Registration successful. Please log in."

  # --- Password validation (frd-auth §3.2, §3.3 — validated after username) ---

  @register
  Scenario: Registration fails when password is empty
    Given I am on the registration page
    When I fill in "username" with "testuser"
    And I fill in "password" with ""
    And I click the "Register" button
    Then I should see the error message "Password is required"
    And I should remain on the registration page

  @register
  Scenario: Registration fails when password is too short
    Given I am on the registration page
    When I fill in "username" with "testuser"
    And I fill in "password" with "short12"
    And I click the "Register" button
    Then I should see the error message "Password must be at least 8 characters"
    And I should remain on the registration page

  @register
  Scenario: Registration succeeds with password at minimum length boundary
    Given I am on the registration page
    When I fill in "username" with "boundary8"
    And I fill in "password" with "exactly8"
    And I click the "Register" button
    Then I should be redirected to "/login"
    And I should see the success message "Registration successful. Please log in."

  # --- Validation order (frd-auth §3.3 — first failing rule returned) ---

  @register
  Scenario: Validation returns first error when both username and password are empty
    Given I am on the registration page
    When I fill in "username" with ""
    And I fill in "password" with ""
    And I click the "Register" button
    Then I should see the error message "Username is required"

  @register
  Scenario: Validation returns username format error before password errors
    Given I am on the registration page
    When I fill in "username" with "ab"
    And I fill in "password" with "short"
    And I click the "Register" button
    Then I should see the error message "Username must be between 3 and 30 characters and contain only letters, numbers, and underscores"

  @register
  Scenario: Validation returns password required error when username is valid but password empty
    Given I am on the registration page
    When I fill in "username" with "validuser"
    And I fill in "password" with ""
    And I click the "Register" button
    Then I should see the error message "Password is required"

  # --- Duplicate username (frd-auth §2.1 — 409) ---

  @register
  Scenario: Registration fails with duplicate username
    Given a registered user with username "existinguser" and password "secureP@ss1"
    And I am on the registration page
    When I fill in "username" with "existinguser"
    And I fill in "password" with "anotherP@ss1"
    And I click the "Register" button
    Then I should see the error message "Username already exists"
    And I should remain on the registration page

  # --- Scenario Outline for parameterized validation (frd-auth §7) ---

  @register
  Scenario Outline: Registration validation rejects invalid input
    Given I am on the registration page
    When I fill in "username" with "<username>"
    And I fill in "password" with "<password>"
    And I click the "Register" button
    Then I should see the error message "<error>"

    Examples:
      | username                        | password     | error                                                                                              |
      |                                 | secureP@ss1  | Username is required                                                                               |
      | ab                              | secureP@ss1  | Username must be between 3 and 30 characters and contain only letters, numbers, and underscores    |
      | a!b                             | secureP@ss1  | Username must be between 3 and 30 characters and contain only letters, numbers, and underscores    |
      | abcdefghijklmnopqrstuvwxyz12345 | secureP@ss1  | Username must be between 3 and 30 characters and contain only letters, numbers, and underscores    |
      | validuser                       |              | Password is required                                                                               |
      | validuser                       | short12      | Password must be at least 8 characters                                                             |

  # --- Register page navigation ---

  @register
  Scenario: Register page has a link to the login page
    Given I am on the registration page
    Then I should see a link "Already have an account? Log in" to "/login"

  # ────────────────────────────────────────────
  # Login (US-2)
  # ────────────────────────────────────────────

  @login @smoke
  Scenario: Successful login redirects to the board
    Given a registered user with username "testuser" and password "secureP@ss1"
    And I am on the login page
    When I fill in "username" with "testuser"
    And I fill in "password" with "secureP@ss1"
    And I click the "Log in" button
    Then I should be redirected to "/board"

  @login
  Scenario: Login button shows loading state during submission
    Given a registered user with username "testuser" and password "secureP@ss1"
    And I am on the login page
    When I fill in "username" with "testuser"
    And I fill in "password" with "secureP@ss1"
    And I click the "Log in" button
    Then the "Log in" button should be disabled
    And the "Log in" button should show "Logging in…"

  @login
  Scenario: Login fails with invalid password
    Given a registered user with username "testuser" and password "secureP@ss1"
    And I am on the login page
    When I fill in "username" with "testuser"
    And I fill in "password" with "wrongpassword"
    And I click the "Log in" button
    Then I should see the error message "Invalid username or password"
    And I should remain on the login page

  @login
  Scenario: Login fails with non-existent username
    Given I am on the login page
    When I fill in "username" with "nonexistent"
    And I fill in "password" with "secureP@ss1"
    And I click the "Log in" button
    Then I should see the error message "Invalid username or password"
    And I should remain on the login page

  @login
  Scenario: Login fails when both fields are empty
    Given I am on the login page
    When I fill in "username" with ""
    And I fill in "password" with ""
    And I click the "Log in" button
    Then I should see the error message "Username and password are required"
    And I should remain on the login page

  @login
  Scenario: Login fails when username is empty
    Given I am on the login page
    When I fill in "username" with ""
    And I fill in "password" with "secureP@ss1"
    And I click the "Log in" button
    Then I should see the error message "Username and password are required"
    And I should remain on the login page

  @login
  Scenario: Login fails when password is empty
    Given I am on the login page
    When I fill in "username" with "testuser"
    And I fill in "password" with ""
    And I click the "Log in" button
    Then I should see the error message "Username and password are required"
    And I should remain on the login page

  @login
  Scenario: Login page displays success message after registration
    Given a registered user with username "freshuser" and password "secureP@ss1"
    When I navigate to "/login?registered=true"
    Then I should see the success message "Registration successful. Please log in."

  @login
  Scenario: Login page does not display success message without query param
    Given I am on the login page
    Then I should not see a success message

  @login
  Scenario: Login page has a link to the register page
    Given I am on the login page
    Then I should see a link "Don't have an account? Register" to "/register"

  # ────────────────────────────────────────────
  # Logout (US-5)
  # ────────────────────────────────────────────

  @logout @smoke
  Scenario: Successful logout clears session and redirects to login
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I click the "Logout" button in the navigation bar
    Then I should be redirected to "/login"
    And the navigation bar should show "Login" and "Register" links

  @logout
  Scenario: Accessing /board after logout redirects to /login
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I click the "Logout" button in the navigation bar
    And I navigate to "/board"
    Then I should be redirected to "/login"

  @logout
  Scenario: Accessing /profile after logout redirects to /login
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I click the "Logout" button in the navigation bar
    And I navigate to "/profile"
    Then I should be redirected to "/login"

  @logout
  Scenario: Logout when not logged in is a no-op
    Given I am not authenticated
    When I send a POST request to "/api/auth/logout"
    Then the response status should be 200

  # ────────────────────────────────────────────
  # Auth Guard (frd-profile §4, frd-auth §6.3)
  # ────────────────────────────────────────────

  @auth-guard @smoke
  Scenario: Unauthenticated user is redirected from /board to /login
    Given I am not authenticated
    When I navigate to "/board"
    Then I should be redirected to "/login"

  @auth-guard
  Scenario: Unauthenticated user is redirected from /profile to /login
    Given I am not authenticated
    When I navigate to "/profile"
    Then I should be redirected to "/login"

  @auth-guard
  Scenario: Authenticated user can access /board
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I navigate to "/board"
    Then I should be on the "/board" page

  @auth-guard
  Scenario: Authenticated user can access /profile
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I navigate to "/profile"
    Then I should be on the "/profile" page
