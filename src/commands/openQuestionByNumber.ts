import * as vscode from "vscode";
import { updateDiagnostics } from "../diagnostics";

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

            const uri = vscode.Uri.parse(`vscode-cal:Question ${questionNumber}.md`);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { preview: true });
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
