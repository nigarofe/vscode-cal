Feature: Saving changes to a question
  This feature tests saving a modified question to the database.

  Background:
    Given the database is initialized
    And I have question number 7 open in the editor

  Scenario: Saving a valid question
    When I modify the "description" in the front matter of question 7
    And I run the "saveQuestion" command
    Then the database should be updated with the new description for question 7
    And I should see a success message "Question 7 updated successfully."

  Scenario: Attempting to save a question with validation errors
    When I remove the "## Proposition" heading from the question's content
    And I run the "saveQuestion" command
    Then I should see an error message "Cannot save, please fix the errors first."
    And the database should not be updated with the invalid content