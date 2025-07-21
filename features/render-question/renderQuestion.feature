Feature: Previewing a question
  This feature ensures that the question preview renders correctly, including markdown, LaTeX, and images.

  Background:
    Given I have a question open in the editor

  Scenario: Opening the question preview
    When I run the "previewQuestion" command
    Then a webview panel should open with the title "Preview Q<question_number>" [cite: 65]
    And the webview should render the question's proposition, step-by-step, and answer as HTML

  Scenario: Rendering LaTeX in the preview
    Given the question's proposition contains the LaTeX expression "$$E=mc^2$$"
    When I preview the question
    Then the webview should correctly render the LaTeX as a mathematical formula

  Scenario: Rendering local images in the preview
    Given the question's step-by-step section contains an image `![alt text](images/diagram.png)`
    When I preview the question
    Then the webview should display the image "images/diagram.png" from the workspace