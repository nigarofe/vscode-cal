### **Validation and Diagnostics**

## **(Generic)**

## **(Ubiquitous)**

## **(State driven)**

## **(Event driven)**
  * When a user opens a question file, the system shall run diagnostics and display any errors found.
  * When a user saves a question file, the system shall run diagnostics and display any errors found.
  * When a user changes the content of a question file, the system shall run diagnostics and display any errors found.
  * When the editor for question `{question_number}` is opened, the system shall ensure the editor content contains the "## Proposition", "## Step-by-step", and "## Answer" sections.

## **(Optional feature)**

## **(Unwanted behaviour)**
  * If a question file has no errors, then the system shall not report any diagnostic errors.
  * If a non-question file is open, then the system shall not run any diagnostics on it.
  * If a diagnostic error is reported, then the system shall not report the same error multiple times for the same issue.

## **(Complex)**
  * While a question file is open and is missing a front matter field like "discipline" or "source", when the diagnostics are updated, the system shall report a diagnostic error with the message "Front matter is missing the '<field>' field.".
  * While a question file is open and the 'tags' field is a string instead of an array, when the diagnostics are updated, the system shall report a diagnostic error with the message "Front matter must have 'tags' as an array.".
  * While a question file is open and is missing a required heading like "## Proposition" or "## Answer", when the diagnostics are updated, the system shall report a diagnostic error with the message "Markdown body is missing the '<heading>' heading.".
