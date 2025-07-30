import * as vscode from "vscode";
import { saveQuestion } from "../db";
import { rebuildCache } from "../Cache";
import { diagnosticsCollection, updateDiagnostics } from "../diagnostics";
import { Question } from "../Question";
import { updatePreviewPanels } from "./previewQuestion";

export function saveQuestionCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.saveQuestion",
        async () => {
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
            const text = doc.getText();
            const questionData = Question.fromText(text);
            const errors = Question.validate(questionData);
            if (errors.length > 0) {
                vscode.window.showErrorMessage(`Could not save: ${errors.join(" ")}`);
                return;
            }
            await saveQuestion(questionData);
            await rebuildCache();

            // Update preview panels with new cached data
            await updatePreviewPanels(context);
        }
    );
}
