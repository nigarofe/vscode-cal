import * as vscode from "vscode";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import * as fs from "fs";
import matter from "gray-matter";
import { GET_QUESTIONS_SQL, UPDATE_QUESTION_SQL } from "./db_sql_queries";
import { Question } from "./Question";

const diagnosticsCollection = vscode.languages.createDiagnosticCollection("question");

async function buildAllQuestions(dbPath: string): Promise<Question[]> {
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

function updateDiagnostics(document: vscode.TextDocument) {
  if (!path.basename(document.fileName).startsWith("question-")) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  try {
    const parsed = matter(text);

    // Front matter validation
    if (!parsed.data.discipline) {
      diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), "Front matter is missing the 'discipline' field.", vscode.DiagnosticSeverity.Error));
    }
    if (!parsed.data.source) {
      diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), "Front matter is missing the 'source' field.", vscode.DiagnosticSeverity.Error));
    }
    if (!parsed.data.tags || !Array.isArray(parsed.data.tags)) {
      diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), "Front matter must have 'tags' as an array.", vscode.DiagnosticSeverity.Error));
    }

    // Body validation
    const requiredHeadings = ["## Description", "## Proposition", "## Answer"];
    for (const heading of requiredHeadings) {
      if (!text.includes(heading)) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, document.lineCount - 1, 1), `Markdown body is missing the '${heading}' heading.`, vscode.DiagnosticSeverity.Error));
      }
    }
  } catch (e: any) {
    diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), `Error parsing front matter: ${e.message}`, vscode.DiagnosticSeverity.Error));
  }

  diagnosticsCollection.set(document.uri, diagnostics);
}

async function saveQuestion(document: vscode.TextDocument) {
    if (!path.basename(document.fileName).startsWith("question-")) {
        return;
    }

    updateDiagnostics(document);
    if (diagnosticsCollection.get(document.uri)?.length) {
        vscode.window.showErrorMessage("Cannot save, please fix the errors first.");
        return;
    }

    const text = document.getText();
    const parsed = matter(text);
    const questionNumber = parseInt(path.basename(document.fileName).split("-")[1].split(".")[0], 10);

    const content = parsed.content;
    const description = content.split("## Description")[1].split("## Proposition")[0].trim();
    const proposition = content.split("## Proposition")[1].split("## Answer")[0].trim();
    const answer = content.split("## Answer")[1].split("## Step-by-step")[0].trim();
    const stepByStep = content.includes("## Step-by-step") ? content.split("## Step-by-step")[1].trim() : null;

    const dbPath = path.join(vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath, "src", "db.db");
    const db = new sqlite3.Database(dbPath);

    db.run(UPDATE_QUESTION_SQL, [
        parsed.data.discipline,
        parsed.data.source,
        description,
        proposition,
        stepByStep,
        answer,
        parsed.data.tags.join(", "),
        questionNumber
    ], function (err) {
        if (err) {
            vscode.window.showErrorMessage(`Error updating question: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(`Question ${questionNumber} updated successfully.`);
        }
    });
    db.close();
}


export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

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
            attempts: q.attempts.map(attempt => ({
              datetime: attempt.date.toISOString(),
              code: attempt.code
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
        const jsonFolderPath = path.join(
          context.extensionPath,
          "src",
          ".json"
        );

        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(jsonFolderPath));
        } catch (error) {
          await vscode.workspace.fs.createDirectory(
            vscode.Uri.file(jsonFolderPath)
          );
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./, '_');
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
    async () => {
      const questionNumberStr = await vscode.window.showInputBox({
        prompt: "Enter the question number",
        placeHolder: "e.g., 1",
        validateInput: (text) => {
          return /^\d+$/.test(text) ? null : "Please enter a valid number.";
        },
      });

      if (questionNumberStr) {
        const questionNumber = parseInt(questionNumberStr, 10);
        const dbPath = path.join(context.extensionPath, "src", "db.db");
        try {
          const questions = await buildAllQuestions(dbPath);
          const question = questions.find(
            (q) => q.question_number === questionNumber
          );

          if (question) {
            const tempDir = path.join(context.extensionPath, "temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            const tempFile = path.join(tempDir, `question-${question.question_number}.md`);

            const frontMatter = {
                discipline: question.discipline,
                source: question.source,
                tags: question.tags
            };

            const content = `---
${Object.entries(frontMatter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}
---

# Question: ${question.question_number}

## Description
${question.description}

## Proposition
${question.proposition}

## Answer
${question.answer}

## Step-by-step
${question.step_by_step || ""}
`;
            fs.writeFileSync(tempFile, content);
            const doc = await vscode.workspace.openTextDocument(tempFile);
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

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => updateDiagnostics(doc))
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document))
  );
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => saveQuestion(doc))
  );
}

export function deactivate() {}