Feature: File diagnostics for question files
  This feature ensures that the extension provides helpful diagnostics for malformed question files.

  Scenario Outline: Missing front matter fields
    Given I have a question file open that is missing the "<field>" field in its front matter
    When the diagnostics are updated
    Then a diagnostic error should be reported with the message "Front matter is missing the '<field>' field."

    Examples:
      | field        |
      | discipline   |
      | source       |

  Scenario: 'tags' field is not an array
    Given I have a question file open where 'tags' is a string instead of an array
    When the diagnostics are updated
    Then a diagnostic error should be reported with the message "Front matter must have 'tags' as an array."

  Scenario Outline: Missing required headings
    Given I have a question file open that is missing the "<heading>" heading
    When the diagnostics are updated
    Then a diagnostic error should be reported with the message "Markdown body is missing the '<heading>' heading."

    Examples:
      | heading           |
      | ## Proposition    |
      | ## Answer         |