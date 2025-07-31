import * as vscode from "vscode";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import { CREATE_QUESTION_SQL, GET_MAX_QUESTION_NUMBER_SQL } from "../db_sql_queries";
import { Question } from "../Question";
import { rebuildCache } from "../cache";
import { updatePreviewPanels } from "./previewQuestion";

export function createQuestionCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('vscode-cal.createQuestion', async () => {
        try {
            const dbPath = path.join(context.extensionPath, "db.db");

            // Get max question number
            const maxNumber = await new Promise<number>((resolve, reject) => {
                const db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                });

                db.get(GET_MAX_QUESTION_NUMBER_SQL, [], (err, row: { max_number: number }) => {
                    if (err) {
                        db.close();
                        reject(err);
                    } else {
                        db.close();
                        resolve(row?.max_number || 0);
                    }
                });
            });

            const newQuestionNumber = maxNumber + 1;

            // Create new question in database
            await new Promise<void>((resolve, reject) => {
                const db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                });

                db.run(CREATE_QUESTION_SQL, ['', '', ``, '', '', '', ''], function (err) {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            // Create new question object and open in editor
            const newQuestion = new Question({
                question_number: newQuestionNumber,
                discipline: '',
                source: '',
                description: '',
                proposition: '',
                step_by_step: '',
                answer: '',
                tags: '[]',
                code_vec_json: '[]',
                date_vec_json: '[]'
            });

            const fileContent = newQuestion.generateContentFromQuestion();

            const doc = await vscode.workspace.openTextDocument({ content: fileContent, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`Created new question #${newQuestionNumber}. Fill in the details and save.`);

            await rebuildCache();

            // Update preview panels with new cached data
            await updatePreviewPanels(context);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error creating question: ${error.message}`);
        }
    });

    return command;
}
