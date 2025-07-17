import * as vscode from 'vscode';

export class SidepanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'cal-question-view';

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

            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'questionEntered': {
                    if (data.value) {
                        vscode.commands.executeCommand('vscode-cal.openQuestionByNumber', parseInt(data.value));
                    }
                    break;
                }
                case 'previewQuestion': {
                    vscode.commands.executeCommand('vscode-cal.previewQuestion');
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
				<title>Question Selector</title>
			</head>
			<body>
				<input type="text" id="question-number" placeholder="Enter question number" />
                <button id="preview-button" class="primary">Preview Question</button>

				<script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const input = document.getElementById('question-number');
                    const previewButton = document.getElementById('preview-button');
                    
                    let timeout;
                    input.addEventListener('keyup', () => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            vscode.postMessage({
                                type: 'questionEntered',
                                value: input.value
                            });
                        }, 500);
                    });

                    previewButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'previewQuestion' });
                    });
				</script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
