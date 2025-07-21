### **Question Management**

## **(Generic)**

## **(Ubiquitous)**

## **(State driven)**

## **(Event driven)**
* When a user runs the "openQuestionByNumber" command and enters a question number, the system shall open a new markdown editor.

## **(Optional feature)**

## **(Unwanted behaviour)**
* If the "openQuestionByNumber" command is run with a non-existent question number, then the system shall show an error message "Question {non_existent_question_number} does not exist.".
* If the "openQuestionByNumber" command is run with an invalid input like, then the system shall show an error message "Please enter a valid number.".
* If the "saveQuestion" command is run with invalid content, then the system shall not update the database.

## **(Complex)**
* While a user has a valid question open in the editor, when the user runs the "saveQuestion" command, the system shall update the question in the satabase and display a success message "Question {question_number} updated successfully.".