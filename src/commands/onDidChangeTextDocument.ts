import * as vscode from "vscode";
import { updateSnippetCacheFromText } from "../snippetCache";
import { getWebviewContent } from "../webview";
import { getPanels } from "./previewQuestion";

let debounce: NodeJS.Timeout | undefined = undefined;

export function onDidChangeTextDocument(context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeTextDocument((event) => {
        const panels = getPanels();
        if (
            panels.length > 0 &&
            event.document === vscode.window.activeTextEditor?.document
        ) {
            if (debounce) {
                clearTimeout(debounce);
            }
            debounce = setTimeout(() => {
                updateSnippetCacheFromText(event.document.getText());
                panels.forEach((panel) => {
                    if (panel.visible) {
                        panel.webview.html = getWebviewContent(
                            event.document.getText(),
                            panel!,
                            context
                        );
                    }
                });
            }, 300);
        }
    });
}
