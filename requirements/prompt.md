Your task is to refactor a set of requirements files to conform to a structural guideline file.

  1. Understand the Guideline:
  First, read the file c:\Users\Nicholas\vscode-cal\requirements\README.md. This file contains mandatory EARS headings (e.g., ## **(Generic)**,
  ## **(Event driven)**, etc.) that must be used to structure the requirements.

  2. Understand the Goal:
  The goal is to preserve all existing requirements while organizing them under the correct EARS headings. You must not simply copy the
  guideline file's content or delete the existing requirements.

  3. Execution Plan:
  For each requirements file in the c:\Users\Nicholas\vscode-cal\requirements\ directory, you must:
      a. Read the existing content of the requirements file.
      b. Analyze each individual requirement statement to determine which EARS pattern it matches based on its syntax.
           - "When..." corresponds to (Event driven).
           - "While... when..." corresponds to (Complex).
           - "If... then..." corresponds to (Unwanted behaviour).
           - "The system shall..." corresponds to (Ubiquitous).
           - etc.
      c. Re-write the file so that it begins with the full, ordered list of mandatory EARS headings extracted from the README.md.
      d. Place each existing requirement from the original file under its corresponding new heading.
      e. If no requirements match a specific heading for a given file, leave that heading blank.