Feature: Question Recommendation
  This feature provides users with question recommendations based on a spaced repetition algorithm to optimize learning. The system should prioritize questions based on their potential memory gain multiplier.

Background:
    Given the database is initialized with questions and their corresponding attempts

Scenario: Successfully recommending a question
    Given there are several questions with different attempt histories and spaced repetition values
    When I run the "recommendQuestion" command
    Then the system should identify the question with the highest "potentialMemoryGainMultiplier"
    And a new markdown editor should open with the content of the recommended question

Scenario: No questions are due for review
    Given all questions have a "potentialMemoryGainMultiplier" less than 1.0 or a non-numeric status
    When I run the "recommendQuestion" command
    Then I should see an information message stating "No questions are due for review at the moment. Great job!"

Scenario: Handling a database with no questions
    Given the questions table in the database is empty
    When I run the "recommendQuestion" command
    Then I should see an error message stating "No questions found in the database to recommend."

Scenario: Recommending a question among several candidates
    Given question 8 has a "potentialMemoryGainMultiplier" of 1.5
    And question 12 has a "potentialMemoryGainMultiplier" of 2.5
    And question 21 has a "potentialMemoryGainMultiplier" of 1.0
    When I run the "recommendQuestion" command
    Then the system should open question 12 in a new editor