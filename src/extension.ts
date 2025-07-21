import * as vscode from "vscode";
import { registerCommands } from "./commands/index";
import { updateDiagnostics } from "./diagnostics";
import { SidepanelProvider } from "./sidepanelProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

  registerCommands(context);

  console.log("apple debug 1");

  const sidepanelProvider = new SidepanelProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidepanelProvider.viewType, sidepanelProvider)
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => updateDiagnostics(doc))
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      updateDiagnostics(e.document)
    )
  );
}

export function deactivate() {}
