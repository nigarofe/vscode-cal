import * as vscode from "vscode";
import { getWebviewContent } from "../webview";
import { getQuestions } from "../cache";

let panels: vscode.WebviewPanel[] = [];

export function previewQuestionCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.previewQuestion",
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor");
                return;
            }

            const text = editor.document.getText();
            const questionNumberMatch = text.match(/^# Question (\d+)/im);

            if (!questionNumberMatch) {
                vscode.window.showErrorMessage("Could not find question number in the current document");
                return;
            }

            const questionNumber = parseInt(questionNumberMatch[1]);

            // Get question from cache instead of using editor content
            const questions = await getQuestions();
            const question = questions.find(q => q.question_number === questionNumber);

            if (!question) {
                vscode.window.showErrorMessage(`Question number ${questionNumber} not found in cache`);
                return;
            }

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

            // Use cached question content instead of editor content
            const cachedContent = question.generateContentFromQuestion();
            panel.webview.html = getWebviewContent(
                cachedContent,
                panel,
                context
            );
        }
    );
}

export function getPanels() {
    return panels;
}
