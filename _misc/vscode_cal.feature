Feature: VS Code CAL Extension

  As a user of the VS Code CAL extension, I want to manage and practice questions efficiently to improve my learning process.

  Scenario: Opening a question by its number
    Given I have the VS Code CAL extension installed
    When I run the "Open Question by Number" command
    And I enter a valid question number
    Then the corresponding question should be opened in a new editor tab
    And the question content should be formatted in Markdown
    And it should contain the question's proposition, step-by-step solution, and answer.

  Scenario: Previewing a question
    Given I have a question file open in the active editor
    When I run the "Preview Question" command
    Then a new webview panel should open to the side
    And it should display a rendered HTML view of the question's content.

  Scenario: Saving a question
    Given I have a question file open in the active editor
    And I have made some changes to the question
    When I run the "Save Question" command
    Then the changes should be saved to the database
    And I should see a success message.

  Scenario: Registering an attempt without help
    Given I have a question file open in the active editor
    When I run the "Register Attempt without Help" command
    Then a new attempt with code 1 should be registered for the current question
    And I should see a success message.

  Scenario: Registering an attempt with help
    Given I have a question file open in the active editor
    When I run the "Register Attempt with Help" command
    Then a new attempt with code 0 should be registered for the current question
    And I should see a success message.

  Scenario: Exporting questions to JSON
    Given I have questions stored in the database
    When I run the "Export Questions to JSON" command
    Then a new JSON file should be created in the "src/.json" directory
    And the file should contain all the questions and their associated data
    And I should see a success message with the file path.


Scenario Outline: Invalid question format diagnostics for missing fields
  Given I have a question file open in the active editor
  And the file is missing the <field> field in the front matter
  When the diagnostics are updated
  Then an error diagnostic should be displayed for the missing <field> field

  Examples:
    | discipline  |
    | description |
    | source      |