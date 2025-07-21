This directory contains the Gherkin feature files that define the behavior of the VS Code extension. These files are used for acceptance testing and to ensure that the software meets the specified requirements. The behavior of each feature is formally defined in the Gherkin .feature files located in their respective subdirectories.

├───export
├───question-management
├───recommendation
├───render-question
└───validation-and-diagnostics

It's recommended that the software be implemented and maintained in the following order:

1. question-management/openQuestion.feature
2. question-management/editQuestion.feature
3. render-question/renderQuestion.
4. validation-and-diagnostics/fileDiagnostics.feature
5. export/exportQuestions.feature
6. recommendation/questionRecommendation.feature
7. recommendation/registerAttempt.feature
