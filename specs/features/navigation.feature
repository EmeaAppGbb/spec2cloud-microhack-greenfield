@navigation
Feature: Navigation Awareness
  As a user, I want to see appropriate navigation links
  so that I can access the pages available to me.

  # Scoped to inc-1: auth-related navigation only (no admin link)

  @smoke
  Scenario: Unauthenticated user sees Login and Register links in the NavBar
    Given I am not authenticated
    When I visit any page
    Then the navigation bar should show the app name "TaskBoard"
    And the navigation bar should show "Login" and "Register" links
    And the navigation bar should not show "Board", "Profile", or "Logout" links

  @smoke
  Scenario: Authenticated user sees Board, Profile, and Logout links in the NavBar
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I visit any page
    Then the navigation bar should show the app name "TaskBoard"
    And the navigation bar should show "Board", "Profile", and "Logout" links
    And the navigation bar should not show "Login" or "Register" links

  Scenario: NavBar shows only app name while auth check is in flight
    Given I visit any page
    Then the navigation bar should show the app name "TaskBoard"
    And no navigation links should be visible until the auth check completes

  Scenario: NavBar transitions to unauthenticated state after logout
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I click the "Logout" button in the navigation bar
    Then the navigation bar should show "Login" and "Register" links
    And the navigation bar should not show "Board", "Profile", or "Logout" links

  Scenario: NavBar app name links to the landing page
    Given I am on any page
    When I click the "TaskBoard" app name in the navigation bar
    Then I should be redirected to "/"
