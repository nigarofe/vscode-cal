Scenario Outline: Registering different types of attempts
  Given I have question number 7 open
  When I register an attempt <help_status>
  Then the database should record an attempt for question 7 with code <code>

  Examples:
    | help_status       | code |
    | "with help"       | 0    |
    | "without help"    | 1    |