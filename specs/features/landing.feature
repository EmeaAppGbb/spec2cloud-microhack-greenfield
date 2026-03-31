@landing
Feature: Landing Page
  As a visitor, I want to see the application landing page
  so that I can understand what the app does and navigate to login or register.

  @smoke
  Scenario: Landing page displays app name and description
    Given I am not authenticated
    When I navigate to "/"
    Then I should see the heading "TaskBoard"
    And I should see the description "A personal task management board. Track your work with ease."

  @smoke
  Scenario: Landing page shows Login and Register CTAs when not authenticated
    Given I am not authenticated
    When I navigate to "/"
    Then I should see a "Login" call-to-action button
    And I should see a "Register" call-to-action button

  Scenario: Landing page Login CTA navigates to login page
    Given I am not authenticated
    And I am on the landing page
    When I click the "Login" call-to-action button
    Then I should be redirected to "/login"

  Scenario: Landing page Register CTA navigates to register page
    Given I am not authenticated
    And I am on the landing page
    When I click the "Register" call-to-action button
    Then I should be redirected to "/register"

  Scenario: Landing page shows Go to Board CTA when authenticated
    Given I am logged in as "testuser" with password "secureP@ss1"
    When I navigate to "/"
    Then I should see a "Go to Board" call-to-action link
    And I should not see "Login" or "Register" call-to-action buttons
