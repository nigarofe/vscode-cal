import * as vscode from 'vscode';
import { buildAllQuestions } from './db';

export class QuestionContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChange = this._onDidChange.event;

    public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const questionNumber = parseInt(uri.path.match(/\d+/)?.[0] || '');
        if (isNaN(questionNumber)) {
            return `Error: Invalid question number in URI: ${uri.toString()}`;
        }

        const questions = await buildAllQuestions();
        const question = questions.find(q => q.question_number === questionNumber);

        if (!question) {
            return `Error: Question number ${questionNumber} not found.`;
        }

        return question.generateContentFromQuestion();
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }
}
