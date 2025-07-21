import * as vscode from "vscode";
import { getWebviewContent } from "../webview";

let panels: vscode.WebviewPanel[] = [];

export function previewQuestionCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.previewQuestion",
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor");
                return;
            }

            const text = editor.document.getText();
            const questionNumberMatch = text.match(/^# Question (\d+)/im);
            const questionNumber = questionNumberMatch ? questionNumberMatch[1] : " ";

            const roots = [
                context.extensionUri,
                ...(vscode.workspace.workspaceFolders || []).map(
                    (folder) => folder.uri
                ),
            ].filter(Boolean) as vscode.Uri[];

            const panel = vscode.window.createWebviewPanel(
                "questionPreview",
                `Preview Q${questionNumber}`,
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    localResourceRoots: roots, // Use the 'roots' variable here
                }
            );

            panels.push(panel);

            panel.onDidDispose(
                () => {
                    panels = panels.filter((p) => p !== panel);
                },
                null,
                context.subscriptions
            );

            panel.webview.html = getWebviewContent(
                editor.document.getText(),
                panel,
                context
            );
        }
    );
}

export function getPanels() {
    return panels;
}
