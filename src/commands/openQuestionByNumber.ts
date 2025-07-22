import * as vscode from "vscode";
import * as path from "path";
import { buildAllQuestions } from "../db";
import { Question } from "../Question";
import { updateDiagnostics } from "../diagnostics";

export function openQuestionByNumberCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.openQuestionByNumber",
        async (questionNumber?: number) => {
            if (questionNumber === undefined) {
                questionNumber = await askForQuestionNumber();
            }

            const questions = await buildAllQuestions();
            const question = questions.find(
                (q) => q.question_number === questionNumber
            );

            if (!question) {
                vscode.window.showErrorMessage(
                    `Question number ${questionNumber} not found.`
                );
                return;
            }

            const doc = await vscode.workspace.openTextDocument({
                content: generateContentForQuestion(question),
                language: "markdown",
            });
            await vscode.window.showTextDocument(doc);
            updateDiagnostics(doc);
        }
    );
}

async function askForQuestionNumber() {
    const questionNumberStr = await vscode.window.showInputBox({
        prompt: "Enter the question number",
        placeHolder: "e.g., 1",
        validateInput: (text) => {
            return /^\d+$/.test(text) ? null : "Please enter a valid number.";
        },
    });
    return parseInt(questionNumberStr || "");
}


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