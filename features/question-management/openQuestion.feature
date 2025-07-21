Feature: Opening a question by its number
  This feature ensures that users can easily open a question by providing its number.

  Background:
    Given the database is initialized with a question number 7

  Scenario: Opening an existing question
    When I run the "openQuestionByNumber" command and enter "7"
    Then a new markdown editor should open
    And the editor content should start with "# Question 7"
    And the editor content should contain the correct front matter for question 7, including "discipline", "description", "source", and "tags" [cite: 56]
    And the editor content should contain the "## Proposition", "## Step-by-step", and "## Answer" sections [cite: 58, 59]

  Scenario: Attempting to open a non-existent question
    When I run the "openQuestionByNumber" command and enter "999"
    Then I should see an error message "Question number 999 not found."

  Scenario: Entering an invalid question number
    When I run the "openQuestionByNumber" command and enter "abc"
    Then I should see an error message "Please enter a valid number."