Feature: Exporting questions to a JSON file
  This feature tests the ability to export all questions and their associated data
  from the database to a JSON file.

  Background:
    Given the database is initialized with several questions and attempts

  Scenario: Successfully exporting questions
    When I run the "exportQuestionsJson" command
    Then a new JSON file should be created in the "src/.json" directory
    And the file name should start with a timestamp and end with "_questions.json"
    And the JSON file should be valid
    And the JSON content should have a "questions" key with a list of all questions
    And each question in the JSON should have the correct structure, including "number", "discipline", "source", "description", "proposition", "step-by-step", "answer", "tags", and "spaced_repetition_variables"