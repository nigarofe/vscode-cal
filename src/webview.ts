import * as vscode from "vscode";
import matter from "gray-matter";
import markdownit from "markdown-it";
import katex from "@vscode/markdown-it-katex";
import { getSnippetById } from "./cache";

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getWebviewContent(
  text: string,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const editor = vscode.window.activeTextEditor;
  const docUri = editor ? editor.document.uri : undefined;

  const { content } = matter(text);
  let resolvedContent = resolveReferences(content);
  resolvedContent = unwrapSnippets(resolvedContent);

  const md = new markdownit({
    html: true,
    linkify: true,
    breaks: true,
  }).use(katex);


  const defaultImageRenderer = md.renderer.rules.image!;

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet("src");

    if (src && !src.startsWith("http") && docUri) {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      let mainFolder;
      let folderPath;
      if (workspaceFolders && workspaceFolders.length > 0) {
        mainFolder = workspaceFolders[0];
        folderPath = mainFolder.uri.fsPath;
        console.log(`The user is in the workspace: ${folderPath}`);
      } else {
        vscode.window.showInformationMessage(
          "No folder is currently open in the workspace."
        );
      }

      if (mainFolder) {
        const onDiskUri = vscode.Uri.joinPath(mainFolder.uri, src);
        const webviewUri = panel.webview.asWebviewUri(onDiskUri);
        token.attrSet("src", webviewUri.toString());
      }
    }
    return defaultImageRenderer(tokens, idx, options, env, self);
  };

  const html = md.render(resolvedContent);

  const katexCss = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "katex",
    "dist",
    "katex.min.css"
  );
  const katexJs = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "katex",
    "dist",
    "katex.min.js"
  );
  const autoRenderJs = vscode.Uri.joinPath(
    context.extensionUri,
    "node_modules",
    "katex",
    "dist",
    "contrib",
    "auto-render.min.js"
  );

  const katexCssUri = panel.webview.asWebviewUri(katexCss);
  const katexJsUri = panel.webview.asWebviewUri(katexJs);
  const autoRenderJsUri = panel.webview.asWebviewUri(autoRenderJs);
  const nonce = getNonce();

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline'; font-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${panel.webview.cspSource} https: data:;"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Question Preview</title>
        <link rel="stylesheet" href="${katexCssUri}">
        <script defer src="${katexJsUri}" nonce="${nonce}"></script>
        <script defer src="${autoRenderJsUri}" nonce="${nonce}"></script>
        <script nonce="${nonce}">
          document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
              delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
              ]
            });
          });
        </script>
        <style>
          body {
            font-size: 1.2em;
          }
          img {
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
        </style>
    </head>
    <body>
        ${html}
    </body>
    </html>
  `;
}


function resolveReferences(content: string): string {
  return content.replace(/<ref id="(.+?)"\s*\/>/g, (match, id) => {
    return getSnippetById(id) || `[Snippet '${id}' not found]`;
  });
}

function unwrapSnippets(content: string): string {
  return content.replace(/<snippet id="(.+?)">([\s\S]*?)<\/snippet>/g, (match, id, innerContent) => {
    return innerContent;
  });
}