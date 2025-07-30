import * as sqlite3 from "sqlite3";
import * as path from "path";
import {
  CREATE_TABLES_SQL,
  UPDATE_QUESTION_SQL,
} from "./db_sql_queries";
import { Question } from "./Question";
import * as vscode from "vscode";

const dbPath = path.resolve(__dirname, "../db.db");

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

export async function saveQuestion(question: Question) {
  const dbPath = path.join(
    vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
    "db.db"
  );
  const db = new sqlite3.Database(dbPath);

  db.run(
    UPDATE_QUESTION_SQL,
    [
      question.discipline,
      question.source,
      question.description,
      question.proposition,
      question.step_by_step,
      question.answer,
      question.tags.join(", "),
      question.question_number,
    ],
    function (err) {
      if (err) {
        vscode.window.showErrorMessage(
          `Error updating question: ${err.message}`
        );
      } else {
        vscode.window.showInformationMessage(
          `Question ${question.question_number} updated successfully.`
        );
      }
    }
  );
  db.close();
}

export async function registerAttempt(questionNumber: number, code: number) {
  const dbPath = path.join(
    vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
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
