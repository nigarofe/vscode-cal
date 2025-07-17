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
  if (!path.basename(document.fileName).startsWith("question-")) {
    return;
  }

  const text = document.getText();
  const parsed = matter(text);
  const questionNumber = parseInt(
    path.basename(document.fileName).split("-")[1].split(".")[0],
    10
  );

  const content = parsed.content;
  const description = content
    .split("## Description")[1]
    .split("## Proposition")[0]
    .trim();
  const proposition = content
    .split("## Proposition")[1]
    .split("## Answer")[0]
    .trim();
  const answer = content
    .split("## Answer")[1]
    .split("## Step-by-step")[0]
    .trim();
  const stepByStep = content.includes("## Step-by-step")
    ? content.split("## Step-by-step")[1].trim()
    : null;

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
