import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { GET_QUESTIONS_SQL } from './db_sql_queries';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-cal" is now active!');

	const disposable = vscode.commands.registerCommand('vscode-cal.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-cal!');
	});

	const showQuestionsCommand = vscode.commands.registerCommand('vscode-cal.showQuestions', () => {
		const dbPath = path.join(context.extensionPath, 'src', 'db.db');
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) {
				vscode.window.showErrorMessage(`Error opening database: ${err.message}`);
				return;
			}
		});

		db.all('SELECT question_number FROM questions ORDER BY question_number', [], (err, rows: { question_number: number }[]) => {
			if (err) {
				vscode.window.showErrorMessage(`Error querying database: ${err.message}`);
				return;
			}

			const questionNumbers = rows.map(row => row.question_number).join('\n');
			vscode.workspace.openTextDocument({ content: questionNumbers, language: 'text' }).then(doc => {
				vscode.window.showTextDocument(doc);
			});
		});

		db.close();
	});

	const showAllQuestionsJsonCommand = vscode.commands.registerCommand('vscode-cal.showAllQuestionsJson', () => {
		const dbPath = path.join(context.extensionPath, 'src', 'db.db');
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) {
				vscode.window.showErrorMessage(`Error opening database: ${err.message}`);
				return;
			}
		});

		db.all(GET_QUESTIONS_SQL, [], (err, rows: any[]) => {
			if (err) {
				vscode.window.showErrorMessage(`Error querying database: ${err.message}`);
				db.close();
				return;
			}

			const questionsAsJson = JSON.stringify(rows, null, 2);
			vscode.workspace.openTextDocument({ content: questionsAsJson, language: 'json' }).then(doc => {
				vscode.window.showTextDocument(doc);
			});

			db.close();
		});
	});

	context.subscriptions.push(disposable, showQuestionsCommand, showAllQuestionsJsonCommand);
}

export function deactivate() {}

