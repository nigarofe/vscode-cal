Feature: Registering attempts for a question
  This feature ensures that user attempts are correctly registered in the database
  and that the user receives appropriate feedback.

  Background:
    Given the database is initialized
    And a question with number 7 exists in the database

  Scenario Outline: Registering different types of attempts via command
    Given I have question number 7 open in the editor
    When I register an attempt <help_status> using the command palette
    Then the database should record an attempt for question 7 with code <code>
    And I should see a success message confirming the attempt was registered

    Examples:
      | help_status    | code |
      | "with help"    | 0    |
      | "without help" | 1    |

  Scenario: Attempting to register an attempt with no active editor
    Given I have no file open in the editor
    When I register an attempt "without help" using the command palette
    Then I should see an information message stating "No active editor."

  Scenario: Attempting to register an attempt for a non-question file
    Given I have a non-question file open in the editor
    When I register an attempt "with help" using the command palette
    Then I should see an error message stating "Could not determine question number."