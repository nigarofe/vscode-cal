import * as vscode from "vscode";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import { CREATE_QUESTION_SQL, GET_MAX_QUESTION_NUMBER_SQL } from "../db_sql_queries";

export function createQuestionCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('vscode-cal.createQuestion', async () => {
        const dbPath = path.join(context.extensionPath, "src", "db.db");
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                vscode.window.showErrorMessage(`Error opening database: ${err.message}`);
                return;
            }
        });

        db.get(GET_MAX_QUESTION_NUMBER_SQL, [], (err, row: { max_number: number }) => {
            if (err) {
                vscode.window.showErrorMessage(`Error getting max question number: ${err.message}`);
                db.close();
                return;
            }

            const newQuestionNumber = (row.max_number || 0) + 1;

            db.run(CREATE_QUESTION_SQL, ['', '', ``, '', '', '', ''], function (err) {
                if (err) {
                    vscode.window.showErrorMessage(`Error creating new question: ${err.message}`);
                } else {
                    const fileContent = `---
discipline: ""
description: ""
source: ""
tags: []
---

# Question ${newQuestionNumber}

## Proposition

## Step-by-step

## Answer
`;
                    vscode.workspace.openTextDocument({ content: fileContent, language: 'markdown' }).then(doc => {
                        vscode.window.showTextDocument(doc);
                        vscode.window.showInformationMessage(`Created new question #${newQuestionNumber}. Fill in the details and save.`);
                    });
                }
                db.close();
            });
        });
    });

    return command;
}
