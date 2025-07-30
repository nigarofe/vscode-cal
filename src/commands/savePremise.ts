import * as vscode from "vscode";
import { savePremise } from "../db";
import { rebuildCache } from "../Cache";
import { Premise } from "../Premise";

export function savePremiseCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.savePremise",
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor to save.");
                return;
            }
            const doc = editor.document;
            const text = doc.getText();

            try {
                const premiseData = Premise.fromText(text);
                const errors = Premise.validate(premiseData);
                if (errors.length > 0) {
                    vscode.window.showErrorMessage(`Could not save: ${errors.join(" ")}`);
                    return;
                }

                await savePremise(premiseData);
                await rebuildCache();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error saving premise: ${error.message}`);
            }
        }
    );
}
