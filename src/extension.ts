import * as vscode from "vscode";
import { registerCommands } from "./commands/commandsLoader";
import { updateDiagnostics } from "./diagnostics";
import { SidepanelProvider } from "./sidepanelProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

  registerCommands(context);

  const sidepanelProvider = new SidepanelProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidepanelProvider.viewType, sidepanelProvider)
  );

  // Automatically open and preview question 1 on extension activation
  setTimeout(async () => {
    try {
      await vscode.commands.executeCommand("vscode-cal.openQuestionByNumber", 1);
      // Small delay to ensure the document is opened before previewing
      setTimeout(() => {
        vscode.commands.executeCommand("vscode-cal.previewQuestion");
      }, 500);
    } catch (error) {
      console.error("Failed to auto-open question 1:", error);
    }
  }, 1000);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => updateDiagnostics(doc))
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      updateDiagnostics(e.document)
    )
  );
}

export function deactivate() { }
