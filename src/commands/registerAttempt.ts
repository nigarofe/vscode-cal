import * as vscode from "vscode";
import { registerAttempt } from "../db";

export function registerAttemptCommand() {
    return vscode.commands.registerCommand(
        "vscode-cal.registerAttempt",
        (attemptCode: number) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor.");
                return;
            }
            const text = editor.document.getText();
            const questionNumberMatch = text.match(/^# Question (\d+)/im);
            if (!questionNumberMatch) {
                vscode.window.showErrorMessage("Could not determine question number.");
                return;
            }
            const questionNumber = parseInt(questionNumberMatch[1], 10);
            registerAttempt(questionNumber, attemptCode);
        }
    );
}