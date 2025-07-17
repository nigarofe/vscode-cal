import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { diagnosticsCollection, updateDiagnostics } from "./diagnostics";
import { saveQuestion } from "./db";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

  registerCommands(context);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => updateDiagnostics(doc))
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document))
  );
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      updateDiagnostics(doc);
      if (diagnosticsCollection.get(doc.uri)?.length) {
        vscode.window.showErrorMessage("Cannot save, please fix the errors first.");
        return;
      }
      saveQuestion(doc);
    })
  );
}

export function deactivate() {}