import * as vscode from "vscode";
import { saveQuestion as saveQuestionToDb } from "../db";
import { diagnosticsCollection, updateDiagnostics } from "../diagnostics";

export function saveQuestionCommand() {
    return vscode.commands.registerCommand(
        "vscode-cal.saveQuestion",
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor to save.");
                return;
            }
            const doc = editor.document;
            updateDiagnostics(doc);
            if (diagnosticsCollection.get(doc.uri)?.length) {
                vscode.window.showErrorMessage(
                    "Cannot save, please fix the errors first."
                );
                return;
            }
            saveQuestionToDb(doc);
        }
    );
}
