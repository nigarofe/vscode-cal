### **Question Management**

## **(Generic)**

## **(Ubiquitous)**
* The system shall open a new markdown editor when the "openQuestionByNumber" command is run with an existing question number.

## **(State driven)**

## **(Event driven)**
* When a user runs the "openQuestionByNumber" command and enters "7", the system shall open a new markdown editor.
* When the editor for question 7 is opened, the system shall ensure the editor content starts with "# Question 7".
* When the editor for question 7 is opened, the system shall ensure the editor content contains the correct front matter, including "discipline", "description", "source", and "tags".
* When the editor for question 7 is opened, the system shall ensure the editor content contains the "## Proposition", "## Step-by-step", and "## Answer" sections.

## **(Optional feature)**

## **(Unwanted behaviour)**
* If the "openQuestionByNumber" command is run with a non-existent question number "999", then the system shall show an error message "Question number 999 not found.".
* If the "openQuestionByNumber" command is run with an invalid input like "abc", then the system shall show an error message "Please enter a valid number.".
* If the "saveQuestion" command is run after removing the "## Proposition" heading from the question's content, then the system shall show an error message "Cannot save, please fix the errors first.".
* If the "saveQuestion" command is run with invalid content, then the system shall not update the database.

## **(Complex)**
* While a user has question number 7 open in the editor, when the user modifies the "description" in the front matter and runs the "saveQuestion" command, the system shall update the database with the new description for question 7.
* While a user has question number 7 open in the editor, when the "saveQuestion" command is successfully run, the system shall display a success message "Question 7 updated successfully.".