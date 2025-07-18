import * as vscode from "vscode";
import matter from "gray-matter";
import markdownit from "markdown-it";
import katex from "@vscode/markdown-it-katex";

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

  const md = new markdownit({
    html: true,
    linkify: true,
  }).use(katex);

  const { content } = matter(text);

  const defaultImageRenderer = md.renderer.rules.image!;

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet("src");

    // console.log("banana debug 1");
    // Check if the path is relative and not a web URL
    if (src && !src.startsWith("http") && docUri) {
      // console.log("banana debug 2");
      const workspaceFolders = vscode.workspace.workspaceFolders;

      let mainFolder;
      let folderPath;
      if (workspaceFolders && workspaceFolders.length > 0) {
        // Use the first folder as the main workspace
        mainFolder = workspaceFolders[0];
        folderPath = mainFolder.uri.fsPath;
        console.log(`The user is in the workspace: ${folderPath}`);
      } else {
        // Handle the case where no folder is open
        vscode.window.showInformationMessage(
          "No folder is currently open in the workspace."
        );
      }

      if (mainFolder) {
        // console.log("banana debug 3");
        // Resolve the image path relative to the markdown file's folder
        const onDiskUri = vscode.Uri.joinPath(mainFolder.uri, src);

        // 👇 Add these logs to see the requested path
        // console.log("--- Image Rendering ---");
        // console.log("  Original src:", src);
        // console.log("  Workspace Used:", mainFolder.uri.fsPath);
        // console.log("  ❌ Requested Path:", onDiskUri.fsPath);
        // console.log("-----------------------");

        const webviewUri = panel.webview.asWebviewUri(onDiskUri);
        token.attrSet("src", webviewUri.toString());
      }
    }
    // Pass the token to the default renderer
    return defaultImageRenderer(tokens, idx, options, env, self);
  };

  const html = md.render(content);

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
    </head>
    <body>
        ${html}
    </body>
    </html>
  `;
}
