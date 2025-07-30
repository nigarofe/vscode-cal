import * as vscode from "vscode";
import { updateDiagnostics } from "../diagnostics";
import { getQuestions } from "../Cache";

export function openQuestionByNumberCommand() {
    return vscode.commands.registerCommand(
        "vscode-cal.openQuestionByNumber",
        async (questionNumber?: number) => {
            if (questionNumber === undefined) {
                questionNumber = await askForQuestionNumber();
            }

            if (isNaN(questionNumber)) {
                return;
            }

            const questions = await getQuestions();
            const question = questions.find(q => q.question_number === questionNumber);

            if (!question) {
                vscode.window.showErrorMessage(`Question number ${questionNumber} not found.`);
                return;
            }

            const fileContent = question.generateContentFromQuestion();
            const doc = await vscode.workspace.openTextDocument({ content: fileContent, language: 'markdown' });
            await vscode.window.showTextDocument(doc, { preview: false });
            updateDiagnostics(doc);
        }
    );
}

async function askForQuestionNumber(): Promise<number> {
    const questionNumberStr = await vscode.window.showInputBox({
        prompt: "Enter the question number",
        placeHolder: "e.g., 1",
        validateInput: (text) => {
            return /^\d+$/.test(text) ? null : "Please enter a valid number.";
        },
    });
    return parseInt(questionNumberStr || "");
}
