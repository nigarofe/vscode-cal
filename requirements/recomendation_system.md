### **Recommendation**

## **(Generic)**

## **(Ubiquitous)**
  * The system shall prioritize question recommendations based on their potential memory gain multiplier.

## **(State driven)**

## **(Event driven)**
  * When the "recommendQuestion" command is run, the system shall identify the question with the highest "potentialMemoryGainMultiplier".
  * When a question is recommended, the system shall open a new markdown editor with the content of the recommended question.
  * When an attempt is successfully registered, the system shall show a success message confirming the attempt was registered.
  * When the "showAllQuestions" command is run, the system shall open a webview panel with the title "All Questions".
  * When the "All Questions" panel is opened, the system shall display a table of questions sorted in descending order by their "Potential Memory Gain Multiplier".

## **(Optional feature)**

## **(Unwanted behaviour)**
  * If the "recommendQuestion" command is run and all questions have a "potentialMemoryGainMultiplier" less than 1.0 or a non-numeric status, then the system shall show an information message stating "No questions are due for review at the moment. Great job!".
  * If the "recommendQuestion" command is run and the questions table in the database is empty, then the system shall show an error message stating "No questions found in the database to recommend.".
  * If an attempt is registered with no active editor, then the system shall show an information message stating "No active editor.".
  * If an attempt is registered for a non-question file, then the system shall show an error message stating "Could not determine question number.".

## **(Complex)**
  * While question 12 has a "potentialMemoryGainMultiplier" of 2.5, which is the highest among all questions, when the "recommendQuestion" command is run, the system shall open question 12 in a new editor.
  * While I have question number 7 open in the editor, when I register an attempt as "with help" using the command palette, the system shall record an attempt for question 7 with code 0.
  * While I have question number 7 open in the editor, when I register an attempt as "without help" using the command palette, the system shall record an attempt for question 7 with code 1.
  * While the "All Questions" panel is open, when a user clicks on the table row for question number 7, the system shall execute the "openQuestionByNumber" command for question 7.
