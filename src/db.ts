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

export async function buildAllQuestions(): Promise<Question[]> {
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
  const questionData = Question.parseFromText(text);

  if (questionData.question_number === -1) {
    vscode.window.showErrorMessage(
      "Could not save: Question number not found in the document."
    );
    return;
  }

  if (!questionData.proposition) {
    vscode.window.showErrorMessage(
      "Could not save: '## Proposition' section not found."
    );
    return;
  }

  if (!questionData.answer) {
    vscode.window.showErrorMessage(
      "Could not save: '## Answer' section not found."
    );
    return;
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
      questionData.discipline,
      questionData.source,
      questionData.description,
      questionData.proposition,
      questionData.step_by_step,
      questionData.answer,
      questionData.tags ? questionData.tags.join(", ") : "",
      questionData.question_number,
    ],
    function (err) {
      if (err) {
        vscode.window.showErrorMessage(
          `Error updating question: ${err.message}`
        );
      } else {
        vscode.window.showInformationMessage(
          `Question ${questionData.question_number} updated successfully.`
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
