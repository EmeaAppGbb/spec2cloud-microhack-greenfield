@profile
Feature: User Profile
  As an authenticated user, I want to view my profile page
  so that I can see my account information.

  # Covers US-3 (View Profile) from FRD-Profile

  @smoke
  Scenario: Profile page shows username, role badge, and member-since date
    Given I am logged in as a user with username "profileuser" and role "user" created at "2025-01-15T08:30:00.000Z"
    When I visit the "/profile" page
    Then I should see the username "profileuser"
    And I should see a role badge displaying "user"
    And I should see the member since date "January 15, 2025"
    And I should see a "Logout" button

  Scenario: Profile page shows correct role for admin user
    Given I am logged in as a user with username "adminprofile" and role "admin" created at "2025-06-01T00:00:00.000Z"
    When I visit the "/profile" page
    Then I should see the username "adminprofile"
    And I should see a role badge displaying "admin"
    And I should see the member since date "June 1, 2025"

  Scenario: Unauthenticated user is redirected to /login
    Given I am not authenticated
    When I visit the "/profile" page
    Then I should be redirected to "/login"

  Scenario: Logout from profile redirects to /login
    Given I am logged in as a user with username "logoutuser" and role "user" created at "2025-01-01T00:00:00.000Z"
    When I visit the "/profile" page
    And I click the "Logout" button
    Then I should be redirected to "/login"
    And the "token" cookie should be cleared

  Scenario: Profile page shows loading state while fetching
    Given I am logged in as a user with username "loaduser" and role "user" created at "2025-01-01T00:00:00.000Z"
    And the API response for "/api/auth/me" is delayed
    When I visit the "/profile" page
    Then I should see the text "Loading profile…"
    And I should not see a "Logout" button
