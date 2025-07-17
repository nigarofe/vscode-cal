import * as vscode from "vscode";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import { GET_QUESTIONS_SQL } from "./db_sql_queries";
import { Question } from "./Question";

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

  context.subscriptions.push(
    exportQuestionsJsonCommand
  );
}

export function deactivate() {}
