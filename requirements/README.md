# Features

This directory contains the feature definitions for the VS Code extension. Each feature is described in a dedicated file, which includes requirements outlining the feature's behavior. These requirements are used for acceptance testing and to ensure that the software meets the specified functionality.

## Feature Overview

The extension is composed of the following features:

*   **Question Management**: Handles the creation, retrieval, and updating of questions. This includes opening questions in the editor, saving changes to the database, and managing the content of question files.
*   **Render Question**: Responsible for previewing questions in a webview panel. It renders the question's content, including Markdown, LaTeX, and images, into HTML.
*   **Validation and Diagnostics**: Provides real-time validation of question files. It checks for errors in the front matter and Markdown body, and displays diagnostic information in the editor.
*   **Export**: Allows for the exporting of questions from the database into a JSON file. This is useful for backups, sharing, or external processing.
*   **Recommendation System**: Implements a spaced repetition-based question recommendation system. It suggests questions for review based on their potential memory gain and provides a view of all questions sorted by this metric.

## Implementation Order

It is recommended that the features be implemented and maintained in the following order to ensure a logical development progression:

1.  **Question Management**
2.  **Render Question**
3.  **Validation and Diagnostics**
4.  **Export**
5.  **Recommendation**

<details>
<summary>Writing Feature Requirements (EARS)</summary>

To ensure clarity and consistency, each requirements file must contain dedicated sections for the following EARS (Easy Approach to Requirements Syntax) patterns. This explicitly defines which patterns are being used for the system's requirements.

Source: [EARS (Easy Approach to Requirements Syntax)](https://alistairmavin.com/ears/)
[Kiro](https://kiro.dev/docs/specs/concepts/)

[](TEMPLATE.md)