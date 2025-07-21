# Mandatory EARS Headings for `requirements.md`

To ensure clarity and consistency, each `requirements.md` file must contain dedicated sections for the following EARS (Easy Approach to Requirements Syntax) patterns. This explicitly defines which patterns are being used for the system's requirements.

Source: [EARS (Easy Approach to Requirements Syntax)](https://alistairmavin.com/ears/)
[Kiro](https://kiro.dev/docs/specs/concepts/)

---
## **(Generic)**
While `<optional pre-condition>`, when `<optional trigger>`, the `<system name>` shall `<system response>`

---
## **(Ubiquitous)**
The `<system name>` shall `<system response>`

---
## **(State driven)**
While `<precondition(s)>`, the `<system name>` shall `<system response>`

---
## **(Event driven)**
When `<trigger>`, the `<system name>` shall `<system response>`

---
## **(Optional feature)**
Where `<feature is included>`, the `<system name>` shall `<system response>`

---
## **(Unwanted behaviour)**
If `<trigger>`, then the `<system name>` shall `<system response>`

---
## **(Complex)**
While `<precondition(s)>`, when `<trigger>`, the `<system name>` shall `<system response>`



# Implementation order
This directory contains the feature files that define the behavior of the VS Code extension. These files are used for acceptance testing and to ensure that the software meets the specified requirements. The behavior of each feature is formally defined in the requirements.md files located in their respective subdirectories.

├───export
├───question-management
├───recommendation
├───render-question
└───validation-and-diagnostics

It's recommended that the software be implemented and maintained in the following order:

1. question-management
2. render-question
3. validation-and-diagnostics
4. export/exportQuestions
5. recommendation/questionRecommendation