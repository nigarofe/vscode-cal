
// =================================================================================
// WARNING: This is an auto-generated file created by merge_ts_files.js
//
// This file is a concatenation of all .ts files found in the project.
// It is intended for quick review or analysis, not for compilation, as it
// does not resolve module dependencies, imports, or exports correctly.
// Editing this file directly is not recommended.
// =================================================================================


// ==========================================================================
// START OF: ..\commands.ts
// ==========================================================================

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import matter from "gray-matter";
import { buildAllQuestions, saveQuestion, registerAttempt } from "./db";
import { getWebviewContent } from "./webview";
import { diagnosticsCollection, updateDiagnostics } from "./diagnostics";

export function registerCommands(context: vscode.ExtensionContext) {
  const exportQuestionsJsonCommand = vscode.commands.registerCommand(
    "vscode-cal.exportQuestionsJson",
    async () => {
      const dbPath = path.join(context.extensionPath, "src", "db.db");
      try {
        const questions = await buildAllQuestions(dbPath);
        const questionsForJson = questions.map((q) => ({
          number: q.question_number,
          discipline: q.discipline,
          source: q.source,
          description: q.description,
          proposition: q.proposition,
          "step-by-step": q.step_by_step,
          answer: q.answer,
          tags: q.tags,
          spaced_repetition_variables: {
            attempts: q.attempts.map((attempt) => ({
              datetime: attempt.date.toISOString(),
              code: attempt.code,
            })),
            DSLA: q.daysSinceLastAttempt,
            LaMI: q.latestMemoryInterval,
            "PMG-D": q.potentialMemoryGainInDays,
            "PMG-X": q.potentialMemoryGainMultiplier,
            total_attempts: q.attemptsSummary.total,
            memory_attempts: q.attemptsSummary.withoutHelp,
            help_attempts: q.attemptsSummary.withHelp,
            attempts_summary: `${q.attemptsSummary.total};${q.attemptsSummary.withoutHelp};${q.attemptsSummary.withHelp}`,
          },
        }));

        const questionsAsJson = JSON.stringify(
          { questions: questionsForJson },
          null,
          2
        );
        const jsonFolderPath = path.join(context.extensionPath, "src", ".json");

        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(jsonFolderPath));
        } catch (error) {
          await vscode.workspace.fs.createDirectory(
            vscode.Uri.file(jsonFolderPath)
          );
        }

        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\./, "_");
        const filePath = path.join(
          jsonFolderPath,
          `${timestamp}_questions.json`
        );
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(filePath),
          Buffer.from(questionsAsJson, "utf8")
        );
        vscode.window.showInformationMessage(
          `Successfully exported questions to ${filePath}`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(error);
      }
    }
  );

  context.subscriptions.push(exportQuestionsJsonCommand);

  const openQuestionByNumberCommand = vscode.commands.registerCommand(
    "vscode-cal.openQuestionByNumber",
    async (questionNumber?: number) => {
      let questionNumberStr: string | undefined;

      if (questionNumber === undefined) {
        questionNumberStr = await vscode.window.showInputBox({
          prompt: "Enter the question number",
          placeHolder: "e.g., 1",
          validateInput: (text) => {
            return /^\d+$/.test(text) ? null : "Please enter a valid number.";
          },
        });
      } else {
        questionNumberStr = questionNumber.toString();
      }

      if (questionNumberStr) {
        const questionNumber = parseInt(questionNumberStr, 10);
        const dbPath = path.join(context.extensionPath, "src", "db.db");
        try {
          const questions = await buildAllQuestions(dbPath);
          const question = questions.find(
            (q) => q.question_number === questionNumber
          );

          if (question) {
            const frontMatter = {
              discipline: question.discipline,
              description: question.description,
              source: question.source,
              tags: question.tags,
            };

            const content =
              `---\n` +
              `${Object.entries(frontMatter)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join("\n")}\n` +
              `---\n\n` +
              `# Question ${question.question_number}\n\n` +
              `## Proposition\n${question.proposition}\n\n` +
              `## Step-by-step\n${question.step_by_step || ""}\n\n` +
              `## Answer\n${question.answer}\n\n`;

            const doc = await vscode.workspace.openTextDocument({
              content: content,
              language: "markdown",
            });
            await vscode.window.showTextDocument(doc);
            updateDiagnostics(doc);
          } else {
            vscode.window.showErrorMessage(
              `Question number ${questionNumber} not found.`
            );
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(error.message);
        }
      }
    }
  );

  context.subscriptions.push(openQuestionByNumberCommand);

  let panels: vscode.WebviewPanel[] = [];
  let debounce: NodeJS.Timeout | undefined = undefined;

  const previewQuestionCommand = vscode.commands.registerCommand(
    "vscode-cal.previewQuestion",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor");
        return;
      }

      const text = editor.document.getText();
      const questionNumberMatch = text.match(/^# Question (\d+)/im);
      const questionNumber = questionNumberMatch ? questionNumberMatch[1] : " ";

      // In your previewQuestionCommand function
      const roots = [
        context.extensionUri,
        // Use the spread operator to include all workspace folder URIs
        ...(vscode.workspace.workspaceFolders || []).map(
          (folder) => folder.uri
        ),
      ].filter(Boolean) as vscode.Uri[];

      // 👇 Add this log to see the whitelisted paths
      // console.log(
      //   "✅ Allowed Webview Roots:",
      //   roots.map((r) => r.fsPath)
      // );

      const panel = vscode.window.createWebviewPanel(
        "questionPreview",
        `Preview Q${questionNumber}`,
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: roots, // Use the 'roots' variable here
        }
      );

      panels.push(panel);

      panel.onDidDispose(
        () => {
          panels = panels.filter((p) => p !== panel);
        },
        null,
        context.subscriptions
      );

      panel.webview.html = getWebviewContent(
        editor.document.getText(),
        panel,
        context
      );
    }
  );
  context.subscriptions.push(previewQuestionCommand);

  const saveQuestionCommand = vscode.commands.registerCommand(
    "vscode-cal.saveQuestion",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor to save.");
        return;
      }
      const doc = editor.document;
      updateDiagnostics(doc);
      if (diagnosticsCollection.get(doc.uri)?.length) {
        vscode.window.showErrorMessage(
          "Cannot save, please fix the errors first."
        );
        return;
      }
      saveQuestion(doc);
    }
  );
  context.subscriptions.push(saveQuestionCommand);

  const registerAttemptWithoutHelpCommand = vscode.commands.registerCommand(
    "vscode-cal.registerAttemptWithoutHelp",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor.");
        return;
      }
      const text = editor.document.getText();
      const questionNumberMatch = text.match(/^# Question (\d+)/im);
      if (!questionNumberMatch) {
        vscode.window.showErrorMessage("Could not determine question number.");
        return;
      }
      const questionNumber = parseInt(questionNumberMatch[1], 10);
      registerAttempt(questionNumber, 1);
    }
  );
  context.subscriptions.push(registerAttemptWithoutHelpCommand);

  const registerAttemptWithHelpCommand = vscode.commands.registerCommand(
    "vscode-cal.registerAttemptWithHelp",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor.");
        return;
      }
      const text = editor.document.getText();
      const questionNumberMatch = text.match(/^# Question (\d+)/im);
      if (!questionNumberMatch) {
        vscode.window.showErrorMessage("Could not determine question number.");
        return;
      }
      const questionNumber = parseInt(questionNumberMatch[1], 10);
      registerAttempt(questionNumber, 0);
    }
  );
  context.subscriptions.push(registerAttemptWithHelpCommand);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      panels.length > 0 &&
      event.document === vscode.window.activeTextEditor?.document
    ) {
      if (debounce) {
        clearTimeout(debounce);
      }
      debounce = setTimeout(() => {
        panels.forEach((panel) => {
          if (panel.visible) {
            panel.webview.html = getWebviewContent(
              event.document.getText(),
              panel!,
              context
            );
          }
        });
      }, 300);
    }
  });
}


// ==========================================================================
// END OF: ..\commands.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\db.ts
// ==========================================================================

import * as sqlite3 from "sqlite3";
import * as path from "path";
import {
  CREATE_TABLES_SQL,
  GET_QUESTIONS_SQL,
  UPDATE_QUESTION_SQL,
} from "./db_sql_queries";
import { Question } from "./Question";
import * as vscode from "vscode";
import matter from "gray-matter";

const dbPath = path.resolve(__dirname, "../src/db.db");

export function initializeDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(
        `Error opening the SQLite database at ${dbPath}`,
        err.message
      );
    } else {
      console.log(`Connected to the SQLite database at ${dbPath}`);
    }
  });
  db.serialize(() => {
    db.exec(CREATE_TABLES_SQL);
  });
  return db;
}

export async function buildAllQuestions(dbPath: string): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`Error opening database: ${err.message}`);
      }
    });

    db.all(GET_QUESTIONS_SQL, [], (err, rows: any[]) => {
      if (err) {
        reject(`Error querying database: ${err.message}`);
      } else {
        const questions = rows.map((row) => new Question(row));
        resolve(questions);
      }
      db.close();
    });
  });
}

export async function saveQuestion(document: vscode.TextDocument) {
  const text = document.getText();
  const questionNumberMatch = text.match(/^# Question (\d+)/im);

  if (!questionNumberMatch) {
    vscode.window.showErrorMessage(
      "Could not save: Question number not found in the document."
    );
    return;
  }
  const questionNumber = parseInt(questionNumberMatch[1], 10);

  const parsed = matter(text);
  const content = parsed.content;

  const description = parsed.data.description;

  let proposition = "";
  let stepByStep = null;
  let answer = "";

  const propositionContent = content.split("## Proposition")[1];
  if (propositionContent === undefined) {
    vscode.window.showErrorMessage(
      "Could not save: '## Proposition' section not found."
    );
    return;
  }

  if (propositionContent.includes("## Step-by-step")) {
    const stepByStepSplit = propositionContent.split("## Step-by-step");
    proposition = stepByStepSplit[0].trim();
    const answerSplit = stepByStepSplit[1].split("## Answer");
    if (answerSplit[1] === undefined) {
      vscode.window.showErrorMessage(
        "Could not save: '## Answer' section not found after '## Step-by-step'."
      );
      return;
    }
    stepByStep = answerSplit[0].trim();
    answer = answerSplit[1].trim();
  } else {
    const answerSplit = propositionContent.split("## Answer");
    if (answerSplit[1] === undefined) {
      vscode.window.showErrorMessage(
        "Could not save: '## Answer' section not found."
      );
      return;
    }
    proposition = answerSplit[0].trim();
    answer = answerSplit[1].trim();
  }

  const dbPath = path.join(
    vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
    "src",
    "db.db"
  );
  const db = new sqlite3.Database(dbPath);

  db.run(
    UPDATE_QUESTION_SQL,
    [
      parsed.data.discipline,
      parsed.data.source,
      description,
      proposition,
      stepByStep,
      answer,
      parsed.data.tags.join(", "),
      questionNumber,
    ],
    function (err) {
      if (err) {
        vscode.window.showErrorMessage(
          `Error updating question: ${err.message}`
        );
      } else {
        vscode.window.showInformationMessage(
          `Question ${questionNumber} updated successfully.`
        );
      }
    }
  );
  db.close();
}

export async function registerAttempt(questionNumber: number, code: number) {
    const dbPath = path.join(
        vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
        "src",
        "db.db"
    );
    const db = new sqlite3.Database(dbPath);

    db.run(
        "INSERT INTO attempts (question_number, code) VALUES (?, ?)",
        [questionNumber, code],
        function (err) {
            if (err) {
                vscode.window.showErrorMessage(
                    `Error registering attempt: ${err.message}`
                );
            } else {
                vscode.window.showInformationMessage(
                    `Attempt for question ${questionNumber} registered successfully.`
                );
            }
        }
    );
    db.close();
}


// ==========================================================================
// END OF: ..\db.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\db_sql_queries.ts
// ==========================================================================

export const GET_QUESTIONS_SQL = `
    SELECT
  q.*,
  COALESCE(
    json_group_array(a.code ORDER BY a.attempt_datetime), '[]' ) AS code_vec_json,
  COALESCE(
    json_group_array(a.attempt_datetime ORDER BY a.attempt_datetime), '[]' ) AS date_vec_json
    FROM questions AS q
    LEFT JOIN attempts AS a
    ON a.question_number = q.question_number
    GROUP BY q.question_number
  `;
export const GET_QUESTION_PROPOSITION_SQL = `
  SELECT proposition, step_by_step FROM questions WHERE question_number = ?
`;
export const CREATE_QUESTION_SQL = `
    INSERT INTO questions (discipline, source, description, proposition, step_by_step, answer, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;
export const UPDATE_QUESTION_SQL = `
    UPDATE questions
    SET discipline = ?, source = ?, description = ?, proposition = ?, step_by_step = ?, answer = ?, tags = ?
    WHERE question_number = ?
`;
export const INSERT_ATTEMPT_SQL = `
    INSERT INTO attempts (question_number, code)
    VALUES (?, ?)
`;
export const CREATE_TABLES_SQL = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS questions (
      question_number INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline      TEXT    NOT NULL,
      source          TEXT    NOT NULL,
      description     TEXT    NOT NULL,
      proposition     TEXT    NOT NULL,
      step_by_step    TEXT,
      answer          TEXT    NOT NULL,
      tags            TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      question_number  INTEGER NOT NULL,
      code             INTEGER NOT NULL,
      attempt_datetime     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_number)
        REFERENCES questions(question_number)
        ON DELETE CASCADE
    );
`;
//# sourceMappingURL=db_sql_queries.js.map


// ==========================================================================
// END OF: ..\db_sql_queries.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\diagnostics.ts
// ==========================================================================

import * as vscode from "vscode";
import * as path from "path";
import matter from "gray-matter";

export const diagnosticsCollection =
  vscode.languages.createDiagnosticCollection("question");

export function updateDiagnostics(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  const questionNumberMatch = text.match(/^# Question (\d+)/im);

  // If it's not a question file, clear diagnostics and return.
  if (!questionNumberMatch) {
    diagnosticsCollection.set(document.uri, []);
    return;
  }

  const questionNumber = questionNumberMatch[1];

  try {
    const parsed = matter(text);

    // Front matter validation
    if (!parsed.data.discipline) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter is missing the 'discipline' field.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    if (!parsed.data.source) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter is missing the 'source' field.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    if (!parsed.data.tags || !Array.isArray(parsed.data.tags)) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter must have 'tags' as an array.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    // Body validation
    const requiredHeadings = [
      "# Question",
      "## Proposition",
      "## Step-by-step",
      "## Answer",
    ];
    for (const heading of requiredHeadings) {
      if (heading === "# Question") {
        const headingRegex = new RegExp(`^# Question ${questionNumber}`, "im");

        if (!headingRegex.test(text)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(0, 0, document.lineCount - 1, 1),
              `Markdown body is missing the '# Question ${questionNumber}' heading.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      } else {
        const headingRegex = new RegExp(`^${heading}(\s|$)`, "im");
        if (!headingRegex.test(text)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(0, 0, document.lineCount - 1, 1),
              `Markdown body is missing the '${heading}' heading.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
    }
  } catch (e: any) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 1),
        `Error parsing front matter: ${e.message}`,
        vscode.DiagnosticSeverity.Error
      )
    );
  }

  diagnosticsCollection.set(document.uri, diagnostics);
}


// ==========================================================================
// END OF: ..\diagnostics.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\extension.ts
// ==========================================================================

import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { diagnosticsCollection, updateDiagnostics } from "./diagnostics";
import { saveQuestion } from "./db";
import { SidepanelProvider } from "./sidepanelProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

  registerCommands(context);

  const sidepanelProvider = new SidepanelProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidepanelProvider.viewType, sidepanelProvider)
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => updateDiagnostics(doc))
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      updateDiagnostics(e.document)
    )
  );
}

export function deactivate() {}


// ==========================================================================
// END OF: ..\extension.ts
// ==========================================================================

// ==========================================================================
// START OF: merged_src.ts
// ==========================================================================


// =================================================================================
// WARNING: This is an auto-generated file created by merge_ts_files.js
//
// This file is a concatenation of all .ts files found in the project.
// It is intended for quick review or analysis, not for compilation, as it
// does not resolve module dependencies, imports, or exports correctly.
// Editing this file directly is not recommended.
// =================================================================================


// ==========================================================================
// START OF: ..\commands.ts
// ==========================================================================

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import matter from "gray-matter";
import { buildAllQuestions, saveQuestion, registerAttempt } from "./db";
import { getWebviewContent } from "./webview";
import { diagnosticsCollection, updateDiagnostics } from "./diagnostics";

export function registerCommands(context: vscode.ExtensionContext) {
  const exportQuestionsJsonCommand = vscode.commands.registerCommand(
    "vscode-cal.exportQuestionsJson",
    async () => {
      const dbPath = path.join(context.extensionPath, "src", "db.db");
      try {
        const questions = await buildAllQuestions(dbPath);
        const questionsForJson = questions.map((q) => ({
          number: q.question_number,
          discipline: q.discipline,
          source: q.source,
          description: q.description,
          proposition: q.proposition,
          "step-by-step": q.step_by_step,
          answer: q.answer,
          tags: q.tags,
          spaced_repetition_variables: {
            attempts: q.attempts.map((attempt) => ({
              datetime: attempt.date.toISOString(),
              code: attempt.code,
            })),
            DSLA: q.daysSinceLastAttempt,
            LaMI: q.latestMemoryInterval,
            "PMG-D": q.potentialMemoryGainInDays,
            "PMG-X": q.potentialMemoryGainMultiplier,
            total_attempts: q.attemptsSummary.total,
            memory_attempts: q.attemptsSummary.withoutHelp,
            help_attempts: q.attemptsSummary.withHelp,
            attempts_summary: `${q.attemptsSummary.total};${q.attemptsSummary.withoutHelp};${q.attemptsSummary.withHelp}`,
          },
        }));

        const questionsAsJson = JSON.stringify(
          { questions: questionsForJson },
          null,
          2
        );
        const jsonFolderPath = path.join(context.extensionPath, "src", ".json");

        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(jsonFolderPath));
        } catch (error) {
          await vscode.workspace.fs.createDirectory(
            vscode.Uri.file(jsonFolderPath)
          );
        }

        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\./, "_");
        const filePath = path.join(
          jsonFolderPath,
          `${timestamp}_questions.json`
        );
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(filePath),
          Buffer.from(questionsAsJson, "utf8")
        );
        vscode.window.showInformationMessage(
          `Successfully exported questions to ${filePath}`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(error);
      }
    }
  );

  context.subscriptions.push(exportQuestionsJsonCommand);

  const openQuestionByNumberCommand = vscode.commands.registerCommand(
    "vscode-cal.openQuestionByNumber",
    async (questionNumber?: number) => {
      let questionNumberStr: string | undefined;

      if (questionNumber === undefined) {
        questionNumberStr = await vscode.window.showInputBox({
          prompt: "Enter the question number",
          placeHolder: "e.g., 1",
          validateInput: (text) => {
            return /^\d+$/.test(text) ? null : "Please enter a valid number.";
          },
        });
      } else {
        questionNumberStr = questionNumber.toString();
      }

      if (questionNumberStr) {
        const questionNumber = parseInt(questionNumberStr, 10);
        const dbPath = path.join(context.extensionPath, "src", "db.db");
        try {
          const questions = await buildAllQuestions(dbPath);
          const question = questions.find(
            (q) => q.question_number === questionNumber
          );

          if (question) {
            const frontMatter = {
              discipline: question.discipline,
              description: question.description,
              source: question.source,
              tags: question.tags,
            };

            const content =
              `---\n` +
              `${Object.entries(frontMatter)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join("\n")}\n` +
              `---\n\n` +
              `# Question ${question.question_number}\n\n` +
              `## Proposition\n${question.proposition}\n\n` +
              `## Step-by-step\n${question.step_by_step || ""}\n\n` +
              `## Answer\n${question.answer}\n\n`;

            const doc = await vscode.workspace.openTextDocument({
              content: content,
              language: "markdown",
            });
            await vscode.window.showTextDocument(doc);
            updateDiagnostics(doc);
          } else {
            vscode.window.showErrorMessage(
              `Question number ${questionNumber} not found.`
            );
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(error.message);
        }
      }
    }
  );

  context.subscriptions.push(openQuestionByNumberCommand);

  let panels: vscode.WebviewPanel[] = [];
  let debounce: NodeJS.Timeout | undefined = undefined;

  const previewQuestionCommand = vscode.commands.registerCommand(
    "vscode-cal.previewQuestion",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor");
        return;
      }

      const text = editor.document.getText();
      const questionNumberMatch = text.match(/^# Question (\d+)/im);
      const questionNumber = questionNumberMatch ? questionNumberMatch[1] : " ";

      // In your previewQuestionCommand function
      const roots = [
        context.extensionUri,
        // Use the spread operator to include all workspace folder URIs
        ...(vscode.workspace.workspaceFolders || []).map(
          (folder) => folder.uri
        ),
      ].filter(Boolean) as vscode.Uri[];

      // 👇 Add this log to see the whitelisted paths
      // console.log(
      //   "✅ Allowed Webview Roots:",
      //   roots.map((r) => r.fsPath)
      // );

      const panel = vscode.window.createWebviewPanel(
        "questionPreview",
        `Preview Q${questionNumber}`,
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: roots, // Use the 'roots' variable here
        }
      );

      panels.push(panel);

      panel.onDidDispose(
        () => {
          panels = panels.filter((p) => p !== panel);
        },
        null,
        context.subscriptions
      );

      panel.webview.html = getWebviewContent(
        editor.document.getText(),
        panel,
        context
      );
    }
  );
  context.subscriptions.push(previewQuestionCommand);

  const saveQuestionCommand = vscode.commands.registerCommand(
    "vscode-cal.saveQuestion",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor to save.");
        return;
      }
      const doc = editor.document;
      updateDiagnostics(doc);
      if (diagnosticsCollection.get(doc.uri)?.length) {
        vscode.window.showErrorMessage(
          "Cannot save, please fix the errors first."
        );
        return;
      }
      saveQuestion(doc);
    }
  );
  context.subscriptions.push(saveQuestionCommand);

  const registerAttemptWithoutHelpCommand = vscode.commands.registerCommand(
    "vscode-cal.registerAttemptWithoutHelp",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor.");
        return;
      }
      const text = editor.document.getText();
      const questionNumberMatch = text.match(/^# Question (\d+)/im);
      if (!questionNumberMatch) {
        vscode.window.showErrorMessage("Could not determine question number.");
        return;
      }
      const questionNumber = parseInt(questionNumberMatch[1], 10);
      registerAttempt(questionNumber, 1);
    }
  );
  context.subscriptions.push(registerAttemptWithoutHelpCommand);

  const registerAttemptWithHelpCommand = vscode.commands.registerCommand(
    "vscode-cal.registerAttemptWithHelp",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor.");
        return;
      }
      const text = editor.document.getText();
      const questionNumberMatch = text.match(/^# Question (\d+)/im);
      if (!questionNumberMatch) {
        vscode.window.showErrorMessage("Could not determine question number.");
        return;
      }
      const questionNumber = parseInt(questionNumberMatch[1], 10);
      registerAttempt(questionNumber, 0);
    }
  );
  context.subscriptions.push(registerAttemptWithHelpCommand);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      panels.length > 0 &&
      event.document === vscode.window.activeTextEditor?.document
    ) {
      if (debounce) {
        clearTimeout(debounce);
      }
      debounce = setTimeout(() => {
        panels.forEach((panel) => {
          if (panel.visible) {
            panel.webview.html = getWebviewContent(
              event.document.getText(),
              panel!,
              context
            );
          }
        });
      }, 300);
    }
  });
}


// ==========================================================================
// END OF: ..\commands.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\db.ts
// ==========================================================================

import * as sqlite3 from "sqlite3";
import * as path from "path";
import {
  CREATE_TABLES_SQL,
  GET_QUESTIONS_SQL,
  UPDATE_QUESTION_SQL,
} from "./db_sql_queries";
import { Question } from "./Question";
import * as vscode from "vscode";
import matter from "gray-matter";

const dbPath = path.resolve(__dirname, "../src/db.db");

export function initializeDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(
        `Error opening the SQLite database at ${dbPath}`,
        err.message
      );
    } else {
      console.log(`Connected to the SQLite database at ${dbPath}`);
    }
  });
  db.serialize(() => {
    db.exec(CREATE_TABLES_SQL);
  });
  return db;
}

export async function buildAllQuestions(dbPath: string): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`Error opening database: ${err.message}`);
      }
    });

    db.all(GET_QUESTIONS_SQL, [], (err, rows: any[]) => {
      if (err) {
        reject(`Error querying database: ${err.message}`);
      } else {
        const questions = rows.map((row) => new Question(row));
        resolve(questions);
      }
      db.close();
    });
  });
}

export async function saveQuestion(document: vscode.TextDocument) {
  const text = document.getText();
  const questionNumberMatch = text.match(/^# Question (\d+)/im);

  if (!questionNumberMatch) {
    vscode.window.showErrorMessage(
      "Could not save: Question number not found in the document."
    );
    return;
  }
  const questionNumber = parseInt(questionNumberMatch[1], 10);

  const parsed = matter(text);
  const content = parsed.content;

  const description = parsed.data.description;

  let proposition = "";
  let stepByStep = null;
  let answer = "";

  const propositionContent = content.split("## Proposition")[1];
  if (propositionContent === undefined) {
    vscode.window.showErrorMessage(
      "Could not save: '## Proposition' section not found."
    );
    return;
  }

  if (propositionContent.includes("## Step-by-step")) {
    const stepByStepSplit = propositionContent.split("## Step-by-step");
    proposition = stepByStepSplit[0].trim();
    const answerSplit = stepByStepSplit[1].split("## Answer");
    if (answerSplit[1] === undefined) {
      vscode.window.showErrorMessage(
        "Could not save: '## Answer' section not found after '## Step-by-step'."
      );
      return;
    }
    stepByStep = answerSplit[0].trim();
    answer = answerSplit[1].trim();
  } else {
    const answerSplit = propositionContent.split("## Answer");
    if (answerSplit[1] === undefined) {
      vscode.window.showErrorMessage(
        "Could not save: '## Answer' section not found."
      );
      return;
    }
    proposition = answerSplit[0].trim();
    answer = answerSplit[1].trim();
  }

  const dbPath = path.join(
    vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
    "src",
    "db.db"
  );
  const db = new sqlite3.Database(dbPath);

  db.run(
    UPDATE_QUESTION_SQL,
    [
      parsed.data.discipline,
      parsed.data.source,
      description,
      proposition,
      stepByStep,
      answer,
      parsed.data.tags.join(", "),
      questionNumber,
    ],
    function (err) {
      if (err) {
        vscode.window.showErrorMessage(
          `Error updating question: ${err.message}`
        );
      } else {
        vscode.window.showInformationMessage(
          `Question ${questionNumber} updated successfully.`
        );
      }
    }
  );
  db.close();
}

export async function registerAttempt(questionNumber: number, code: number) {
    const dbPath = path.join(
        vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
        "src",
        "db.db"
    );
    const db = new sqlite3.Database(dbPath);

    db.run(
        "INSERT INTO attempts (question_number, code) VALUES (?, ?)",
        [questionNumber, code],
        function (err) {
            if (err) {
                vscode.window.showErrorMessage(
                    `Error registering attempt: ${err.message}`
                );
            } else {
                vscode.window.showInformationMessage(
                    `Attempt for question ${questionNumber} registered successfully.`
                );
            }
        }
    );
    db.close();
}


// ==========================================================================
// END OF: ..\db.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\db_sql_queries.ts
// ==========================================================================

export const GET_QUESTIONS_SQL = `
    SELECT
  q.*,
  COALESCE(
    json_group_array(a.code ORDER BY a.attempt_datetime), '[]' ) AS code_vec_json,
  COALESCE(
    json_group_array(a.attempt_datetime ORDER BY a.attempt_datetime), '[]' ) AS date_vec_json
    FROM questions AS q
    LEFT JOIN attempts AS a
    ON a.question_number = q.question_number
    GROUP BY q.question_number
  `;
export const GET_QUESTION_PROPOSITION_SQL = `
  SELECT proposition, step_by_step FROM questions WHERE question_number = ?
`;
export const CREATE_QUESTION_SQL = `
    INSERT INTO questions (discipline, source, description, proposition, step_by_step, answer, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;
export const UPDATE_QUESTION_SQL = `
    UPDATE questions
    SET discipline = ?, source = ?, description = ?, proposition = ?, step_by_step = ?, answer = ?, tags = ?
    WHERE question_number = ?
`;
export const INSERT_ATTEMPT_SQL = `
    INSERT INTO attempts (question_number, code)
    VALUES (?, ?)
`;
export const CREATE_TABLES_SQL = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS questions (
      question_number INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline      TEXT    NOT NULL,
      source          TEXT    NOT NULL,
      description     TEXT    NOT NULL,
      proposition     TEXT    NOT NULL,
      step_by_step    TEXT,
      answer          TEXT    NOT NULL,
      tags            TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      question_number  INTEGER NOT NULL,
      code             INTEGER NOT NULL,
      attempt_datetime     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_number)
        REFERENCES questions(question_number)
        ON DELETE CASCADE
    );
`;
//# sourceMappingURL=db_sql_queries.js.map


// ==========================================================================
// END OF: ..\db_sql_queries.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\diagnostics.ts
// ==========================================================================

import * as vscode from "vscode";
import * as path from "path";
import matter from "gray-matter";

export const diagnosticsCollection =
  vscode.languages.createDiagnosticCollection("question");

export function updateDiagnostics(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  const questionNumberMatch = text.match(/^# Question (\d+)/im);

  // If it's not a question file, clear diagnostics and return.
  if (!questionNumberMatch) {
    diagnosticsCollection.set(document.uri, []);
    return;
  }

  const questionNumber = questionNumberMatch[1];

  try {
    const parsed = matter(text);

    // Front matter validation
    if (!parsed.data.discipline) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter is missing the 'discipline' field.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    if (!parsed.data.source) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter is missing the 'source' field.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    if (!parsed.data.tags || !Array.isArray(parsed.data.tags)) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter must have 'tags' as an array.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    // Body validation
    const requiredHeadings = [
      "# Question",
      "## Proposition",
      "## Step-by-step",
      "## Answer",
    ];
    for (const heading of requiredHeadings) {
      if (heading === "# Question") {
        const headingRegex = new RegExp(`^# Question ${questionNumber}`, "im");

        if (!headingRegex.test(text)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(0, 0, document.lineCount - 1, 1),
              `Markdown body is missing the '# Question ${questionNumber}' heading.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      } else {
        const headingRegex = new RegExp(`^${heading}(\s|$)`, "im");
        if (!headingRegex.test(text)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(0, 0, document.lineCount - 1, 1),
              `Markdown body is missing the '${heading}' heading.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
    }
  } catch (e: any) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 1),
        `Error parsing front matter: ${e.message}`,
        vscode.DiagnosticSeverity.Error
      )
    );
  }

  diagnosticsCollection.set(document.uri, diagnostics);
}


// ==========================================================================
// END OF: ..\diagnostics.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\extension.ts
// ==========================================================================

import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { diagnosticsCollection, updateDiagnostics } from "./diagnostics";
import { saveQuestion } from "./db";
import { SidepanelProvider } from "./sidepanelProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

  registerCommands(context);

  const sidepanelProvider = new SidepanelProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidepanelProvider.viewType, sidepanelProvider)
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => updateDiagnostics(doc))
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      updateDiagnostics(e.document)
    )
  );
}

export function deactivate() {}


// ==========================================================================
// END OF: ..\extension.ts
// ==========================================================================



// ==========================================================================
// END OF: merged_src.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\Question.ts
// ==========================================================================

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STATUS_NA = "NA";
const STATUS_SA = "SA";
const STATUS_WH = "W/H";

export class Question {
  // From DB
  question_number: number;
  discipline: string;
  source: string;
  description: string;
  proposition: string;
  step_by_step: string | null;
  answer: string;
  tags: string[];
  attempts: { code: number; date: Date }[];

  // Calculated properties
  daysSinceLastAttempt: number | null;
  latestMemoryInterval: number | string;
  potentialMemoryGainMultiplier: number | string;
  potentialMemoryGainInDays: number | string;
  attemptsSummary: {
    total: number;
    withoutHelp: number;
    withHelp: number;
  };

  constructor(dbData: any) {
    // Assign data from the database record
    this.question_number = dbData.question_number;
    this.discipline = dbData.discipline;
    this.source = dbData.source;
    this.description = dbData.description;
    this.proposition = dbData.proposition;
    this.step_by_step = dbData.step_by_step;
    this.answer = dbData.answer;
    this.tags = dbData.tags
      ? dbData.tags.split(",").map((tag: string) => tag.trim())
      : [];

    const codeVec: number[] = JSON.parse(dbData.code_vec_json || "[]");
    const dateVec: string[] = JSON.parse(dbData.date_vec_json || "[]");
    this.attempts = codeVec.map((code, index) => ({
      code: code,
      date: new Date(dateVec[index]),
    }));

    // Initialize calculated properties
    this.daysSinceLastAttempt = this.calculateDaysSinceLastAttempt();
    this.attemptsSummary = this.calculateAttemptsSummary(codeVec);

    // The logic from calculateLatestMemoryIntervalAndPotentialGain is now directly in the constructor
    // to satisfy TypeScript's strict initialization rules.
    if (this.attempts.length === 0) {
      this.latestMemoryInterval = STATUS_NA;
      this.potentialMemoryGainMultiplier = STATUS_NA;
      this.potentialMemoryGainInDays = STATUS_NA;
    } else {
      const memoryIntervals: number[] = [];
      for (let j = 1; j < codeVec.length; j++) {
        if (codeVec[j] === 1) {
          const prev = new Date(dateVec[j - 1]);
          const curr = new Date(dateVec[j]);
          const interval = Math.floor(
            (curr.getTime() - prev.getTime()) / MS_PER_DAY
          );
          memoryIntervals.push(interval);
        }
      }

      const lastCode = codeVec[codeVec.length - 1];
      const daysSinceLast = this.daysSinceLastAttempt;

      if (daysSinceLast === null) {
        // This case should ideally not be hit if attempts > 0, but it's a safeguard.
        this.latestMemoryInterval = STATUS_NA;
        this.potentialMemoryGainMultiplier = STATUS_NA;
        this.potentialMemoryGainInDays = STATUS_NA;
      } else if (lastCode === 1 && codeVec.length === 1) {
        this.latestMemoryInterval = STATUS_SA;
        this.potentialMemoryGainMultiplier = STATUS_SA;
        this.potentialMemoryGainInDays = daysSinceLast;
      } else if (memoryIntervals.length === 0 || lastCode === 0) {
        this.latestMemoryInterval = STATUS_WH;
        this.potentialMemoryGainMultiplier = STATUS_WH;
        this.potentialMemoryGainInDays = daysSinceLast;
      } else {
        const lastInterval = memoryIntervals[memoryIntervals.length - 1];
        const latestInterval = lastInterval === 0 ? 1 : lastInterval;
        this.latestMemoryInterval = latestInterval;
        this.potentialMemoryGainMultiplier = parseFloat(
          (daysSinceLast / latestInterval).toFixed(2)
        );
        this.potentialMemoryGainInDays = daysSinceLast - latestInterval;
      }
    }
  }

  private calculateDaysSinceLastAttempt(): number | null {
    if (this.attempts.length === 0) {
      return null;
    }
    const lastAttemptDate = this.attempts[this.attempts.length - 1].date;
    const today = new Date();
    // Set both dates to midnight to compare just the days
    lastAttemptDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastAttemptDate.getTime();
    return Math.floor(diffTime / MS_PER_DAY);
  }

  private calculateAttemptsSummary(code_vector: number[]) {
    const withoutHelp = code_vector.filter((c) => c === 1).length;
    const withHelp = code_vector.filter((c) => c === 0).length;
    return {
      total: withoutHelp + withHelp,
      withoutHelp,
      withHelp,
    };
  }
}


// ==========================================================================
// END OF: ..\Question.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\sidepanelProvider.ts
// ==========================================================================

import * as vscode from "vscode";

export class SidepanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "cal-question-view";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "questionEntered": {
          if (data.value) {
            vscode.commands.executeCommand(
              "vscode-cal.openQuestionByNumber",
              parseInt(data.value)
            );
          }
          break;
        }
        case "previewQuestion": {
          vscode.commands.executeCommand("vscode-cal.previewQuestion");
          break;
        }
        case "saveQuestion": {
          vscode.commands.executeCommand("vscode-cal.saveQuestion");
          break;
        }
        case "registerAttemptWithoutHelp": {
          vscode.commands.executeCommand(
            "vscode-cal.registerAttemptWithoutHelp"
          );
          break;
        }
        case "registerAttemptWithHelp": {
          vscode.commands.executeCommand("vscode-cal.registerAttemptWithHelp");
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return /*html*/ `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
				<title>Question Selector</title>
			</head>
			<body>
				<div class="container">
					<div class="input-container">
						<input type="text" id="question-number" placeholder="Enter question number" />
					</div>
					<div class="button-container">
						<button id="preview-button" class="primary">Preview Question</button>
					</div>
					<div class="button-container">
						<button id="save-button" class="primary">Save Question</button>
					</div>
                    <div class="button-container">
                        <button id="register-attempt-without-help-button" class="secondary-green">Register attempt without help</button>
                    </div>
                    <div class="button-container">
                        <button id="register-attempt-with-help-button" class="secondary-yellow">Register attempt with help</button>
                    </div>
				</div>

				<script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const input = document.getElementById('question-number');
                    const previewButton = document.getElementById('preview-button');
                    const saveButton = document.getElementById('save-button');
                    const registerAttemptWithoutHelpButton = document.getElementById('register-attempt-without-help-button');
                    const registerAttemptWithHelpButton = document.getElementById('register-attempt-with-help-button');
                    
                    let timeout;
                    input.addEventListener('keyup', () => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            vscode.postMessage({
                                type: 'questionEntered',
                                value: input.value
                            });
                        }, 500);
                    });

                    previewButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'previewQuestion' });
                    });

                    saveButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'saveQuestion' });
                    });

                    registerAttemptWithoutHelpButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'registerAttemptWithoutHelp' });
                    });

                    registerAttemptWithHelpButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'registerAttemptWithHelp' });
                    });
				</script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


// ==========================================================================
// END OF: ..\sidepanelProvider.ts
// ==========================================================================

// ==========================================================================
// START OF: ..\webview.ts
// ==========================================================================

import * as vscode from "vscode";
import matter from "gray-matter";
import markdownit from "markdown-it";
import katex from "@vscode/markdown-it-katex";

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getWebviewContent(
  text: string,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const editor = vscode.window.activeTextEditor;
  const docUri = editor ? editor.document.uri : undefined;

  const md = new markdownit({
    html: true,
    linkify: true,
  }).use(katex);

  const { content } = matter(text);

  const defaultImageRenderer = md.renderer.rules.image!;

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet("src");

    // console.log("banana debug 1");
    // Check if the path is relative and not a web URL
    if (src && !src.startsWith("http") && docUri) {
      // console.log("banana debug 2");
      const workspaceFolders = vscode.workspace.workspaceFolders;

      let mainFolder = null;
      let folderPath = null;
      if (workspaceFolders && workspaceFolders.length > 0) {
        // Use the first folder as the main workspace
        mainFolder = workspaceFolders[0];
        folderPath = mainFolder.uri.fsPath;
        console.log(`The user is in the workspace: ${folderPath}`);
      } else {
        // Handle the case where no folder is open
        vscode.window.showInformationMessage(
          "No folder is currently open in the workspace."
        );
      }

      if (mainFolder) {
        // console.log("banana debug 3");
        // Resolve the image path relative to the markdown file's folder
        const onDiskUri = vscode.Uri.joinPath(mainFolder.uri, src);

        // 👇 Add these logs to see the requested path
        // console.log("--- Image Rendering ---");
        // console.log("  Original src:", src);
        // console.log("  Workspace Used:", mainFolder.uri.fsPath);
        // console.log("  ❌ Requested Path:", onDiskUri.fsPath);
        // console.log("-----------------------");

        const webviewUri = panel.webview.asWebviewUri(onDiskUri);
        token.attrSet("src", webviewUri.toString());
      }
    }
    // Pass the token to the default renderer
    return defaultImageRenderer(tokens, idx, options, env, self);
  };

  const html = md.render(content);

  const katexCss = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "katex",
    "dist",
    "katex.min.css"
  );
  const katexJs = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "katex",
    "dist",
    "katex.min.js"
  );
  const autoRenderJs = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "katex",
    "dist",
    "contrib",
    "auto-render.min.js"
  );

  const katexCssUri = panel.webview.asWebviewUri(katexCss);
  const katexJsUri = panel.webview.asWebviewUri(katexJs);
  const autoRenderJsUri = panel.webview.asWebviewUri(autoRenderJs);
  const nonce = getNonce();

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline'; font-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${panel.webview.cspSource} https: data:;"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Question Preview</title>
        <link rel="stylesheet" href="${katexCssUri}">
        <script defer src="${katexJsUri}" nonce="${nonce}"></script>
        <script defer src="${autoRenderJsUri}" nonce="${nonce}"></script>
        <script nonce="${nonce}">
          document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
              delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
              ]
            });
          });
        </script>
    </head>
    <body>
        ${html}
    </body>
    </html>
  `;
}


// ==========================================================================
// END OF: ..\webview.ts
// ==========================================================================

