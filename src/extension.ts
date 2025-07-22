import * as vscode from "vscode";
import { registerCommands } from "./commands/commandsLoader";
import { updateDiagnostics } from "./diagnostics";
import { SidepanelProvider } from "./sidepanelProvider";
import { QuestionContentProvider } from "./QuestionContentProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-cal" is now active!');

  const questionContentProvider = new QuestionContentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('vscode-cal', questionContentProvider)
  );

  registerCommands(context);

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

export function deactivate() { }
