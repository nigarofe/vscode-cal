Feature: Viewing all questions in a sorted panel
  This feature allows users to see a complete list of their questions in a single panel,
  sorted by the "Potential Memory Gain Multiplier" to help them decide what to study next.

Background:
    Given the database is initialized with several questions and attempts

Scenario: Opening the panel and viewing sorted questions
    Given question 8 has a "potentialMemoryGainMultiplier" of 1.5
    And question 12 has a "potentialMemoryGainMultiplier" of 2.5
    And question 21 has a string-based "potentialMemoryGainMultiplier" like "NA"
    When I run the "showAllQuestions" command
    Then a webview panel should open with the title "All Questions"
    And the panel should display a table of questions
    And the questions in the table should be sorted in descending order by their multiplier, with question 12 appearing before question 8

Scenario: Interacting with the panel to open a question
    Given the "All Questions" panel is open and displays question 7
    When I click on the table row corresponding to question number 7
    Then the "openQuestionByNumber" command should be executed for question 7
    And a new markdown editor should open with the content of question 7