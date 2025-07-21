import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class SidepanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "cal-question-view";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "openQuestion": {
          vscode.commands.executeCommand(
            "vscode-cal.openQuestionByNumber",
            parseInt(data.value)
          );
          break;
        }
        case "previewQuestion": {
          vscode.commands.executeCommand("vscode-cal.previewQuestion");
          break;
        }
        case "saveQuestion": {
          vscode.commands.executeCommand("vscode-cal.saveQuestion");
          break;
        }
        case "registerAttempt": {
          vscode.commands.executeCommand(
            "vscode-cal.registerAttempt",
            data.value
          );
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );

    const nonce = getNonce();

    const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'sidepanel.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    html = html.replace(/\${webview.cspSource}/g, webview.cspSource)
               .replace(/\${nonce}/g, nonce)
               .replace(/\${styleResetUri}/g, styleResetUri.toString())
               .replace(/\${styleVSCodeUri}/g, styleVSCodeUri.toString())
               .replace(/\${styleMainUri}/g, styleMainUri.toString());

    return html;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
