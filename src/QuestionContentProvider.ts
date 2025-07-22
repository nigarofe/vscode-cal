import * as vscode from 'vscode';
import { buildAllQuestions } from './db';
import { Question } from './Question';

function generateContentForQuestion(question: Question) {
    return `---
discipline: ${JSON.stringify(question.discipline)}
description: ${JSON.stringify(question.description)}
source: ${JSON.stringify(question.source)}
tags: ${JSON.stringify(question.tags)}
---

# Question ${question.question_number}

## Proposition
${question.proposition}

## Step-by-step
${question.step_by_step || ""}

## Answer
${question.answer}
`;
}

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

        return generateContentForQuestion(question);
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }
}
