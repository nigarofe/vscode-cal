import * as vscode from "vscode";
import * as path from "path";
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

      const roots = [
        context.extensionUri,
        ...(vscode.workspace.workspaceFolders || []).map(
          (folder) => folder.uri
        ),
      ].filter(Boolean) as vscode.Uri[];

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
