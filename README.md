# VSCode CAL: Spaced Repetition in Your Editor

**VSCode CAL (Computer-Aided Learning)** is a powerful, local-first spaced repetition system (SRS) built directly into Visual Studio Code. It's designed for developers, students, and professionals who want to learn and retain technical knowledge using a tool they already love.

Manage a private library of study questions using Markdown, track your progress with a sophisticated SRS algorithm, and keep all your learning data on your own machine.

---

## Features

- 📚 **Local-First Database**: All your questions and study history are stored in a private SQLite database within the extension's folder.
- ✍️ **Markdown with Front Matter**: Create and edit questions using familiar Markdown syntax, with metadata managed through a simple YAML front matter block.
- ✨ **Live Preview**: Get a real-time, rendered preview of your questions, with full support for **LaTeX** mathematical notations (via KaTeX) and local images.
- 🧠 **Spaced Repetition**: Register study attempts as "with help" or "without help". The extension automatically calculates key SRS metrics to help you decide what to study next.
- ✅ **Real-Time Validation**: An integrated linter provides instant feedback, adding error squiggles if your question file doesn't follow the required format, ensuring data integrity.
- 📈 **Data Export**: Export your entire question library, including all attempts and calculated SRS variables, to a timestamped JSON file for analysis or backup.
- ⚡ **Convenient Side Panel**: Use the activity bar side panel for quick access to the most common commands, like opening, previewing, and saving questions.

---

## How to Use

### Basic Workflow

1.  **Open the Side Panel**: Click on the extension's icon in the Activity Bar to open the **CAL Question View**. This panel is your main command center.
2.  **Open a Question**: In the side panel's input box, type the number of the question you wish to view or edit. The question will open in a new editor tab as a temporary Markdown file.
3.  **Edit the Question**: Make your changes directly in the Markdown file. Ensure you follow the required format (see **Question Format** below). The built-in diagnostics will guide you by highlighting any formatting errors.
4.  **Preview Your Changes**: Use the `Preview Question` button in the side panel (or run the command) to open a live-rendered view of your edits in a split pane.
5.  **Save to Database**: Once your edits are complete and all validation errors are gone, click the `Save Question` button. Your changes will be saved back to the SQLite database.
6.  **Register an Attempt**: After studying a question, use the `Register attempt without help` or `Register attempt with help` buttons to log your performance. This is essential for the spaced repetition system.

### The Question Format

Every question file must follow a specific structure: a YAML front matter block followed by a Markdown body with required headings.

```markdown
---
discipline: "Physics"
source: "University Physics Vol. 1"
description: "A classic kinematics problem involving constant acceleration."
tags: ["kinematics", "physics-101", "calculus"]
---

# Question 42

## Proposition

A car accelerates from rest at a constant rate of $2.0 \text{ m/s}^2$. What is its velocity after traveling $100 \text{ m}$?

## Step-by-step

1.  Identify the known variables: initial velocity $v_0 = 0$, acceleration $a = 2.0 \text{ m/s}^2$, and displacement $\Delta x = 100 \text{ m}$.
2.  Choose the appropriate kinematic equation. The one that relates final velocity, initial velocity, acceleration, and displacement is $v_f^2 = v_0^2 + 2a\Delta x$.
3.  Substitute the known values into the equation: $v_f^2 = 0^2 + 2(2.0)(100)$.
4.  Solve for $v_f$: $v_f^2 = 400$, so $v_f = \sqrt{400} = 20 \text{ m/s}$.

## Answer

The final velocity of the car is $20 \text{ m/s}$.
```

**Validation Rules:**

- The front matter must contain `discipline`, `source`, `description`, and `tags` (as a YAML list).
- The body must contain the headings `# Question <number>`, `## Proposition`, `## Step-by-step`, and `## Answer`. The step-by-step section is optional but the heading must be present.

---

## Commands

Access these commands via the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).

| Command                                 | Description                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `vscode-cal.openQuestionByNumber`       | Prompts for a number and opens the corresponding question.                                                      |
| `vscode-cal.previewQuestion`            | Renders the currently active question file in a new preview panel.                                              |
| `vscode-cal.saveQuestion`               | Saves the content of the active question editor to the database. Fails if there are validation errors.          |
| `vscode-cal.registerAttemptWithoutHelp` | Logs a successful attempt (code: 1) for the current question.                                                   |
| `vscode-cal.registerAttemptWithHelp`    | Logs an unsuccessful attempt or one where you needed hints (code: 0).                                           |
| `vscode-cal.exportQuestionsJson`        | Exports all questions and their associated metadata to a `.json` file in the extension's `src/.json` directory. |

---

## Spaced Repetition Metrics

When you export your data, each question includes a `spaced_repetition_variables` object with the following keys, which help you track your memory decay and schedule reviews.

- **`DSLA` (Days Since Last Attempt)**: The number of days that have passed since you last reviewed this question.
- **`LaMI` (Latest Memory Interval)**: The number of days between your last two successful, unaided attempts. This represents the current strength of your memory for this item.
- **`PMG-D` (Potential Memory Gain in Days)**: If you answer correctly now, this is the number of days you'll add to your `LaMI`. It's calculated as `DSLA - LaMI`.
- **`PMG-X` (Potential Memory Gain Multiplier)**: A ratio (`DSLA / LaMI`) that indicates how much your memory interval could grow. A higher value (e.g., \> 2.0) suggests it's an optimal time to review.
- **Statuses**: If there isn't enough data, these fields may show a status:
  - `NA` (Not Applicable): No attempts have been made.
  - `SA` (Single Attempt): Only one successful attempt has been made.
  - `W/H` (With Help): The last attempt was made with help, so a memory interval cannot be calculated.

---

## License

This extension is licensed under the MIT License.
