import * as vscode from "vscode";
import { registerAttempt } from "../db";

export function registerAttemptCommand() {
    return vscode.commands.registerCommand(
        "vscode-cal.registerAttempt",
        async (attemptCode?: number) => {
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

            if (attemptCode === undefined) {
                const attemptCodeStr = await vscode.window.showInputBox({
                    prompt: "Enter the attempt code (0 for with help, 1 for without help)",
                    placeHolder: "e.g., 1",
                    validateInput: (text) => {
                        return /^[01]$/.test(text) ? null : "Please enter 0 or 1.";
                    },
                });
                if (attemptCodeStr) {
                    attemptCode = parseInt(attemptCodeStr, 10);
                } else {
                    return; // User cancelled the input
                }
            }
            
            registerAttempt(questionNumber, attemptCode);
        }
    );
}