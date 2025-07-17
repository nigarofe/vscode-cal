import * as vscode from "vscode";
import matter from "gray-matter";
import markdownit from "markdown-it";
import katex from "@vscode/markdown-it-katex";

export function getWebviewContent(
  text: string,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const md = new markdownit({
    html: true,
    linkify: true,
  }).use(katex);

  const { content } = matter(text);
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

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Question Preview</title>
        <link rel="stylesheet" href="${katexCssUri}">
        <script defer src="${katexJsUri}"></script>
        <script defer src="${autoRenderJsUri}"></script>
        <script>
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
