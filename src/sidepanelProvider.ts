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
                case 'saveQuestion': {
                    vscode.commands.executeCommand('vscode-cal.saveQuestion');
                    break;
                }
                case 'registerAttemptWithoutHelp': {
                    vscode.commands.executeCommand('vscode-cal.registerAttemptWithoutHelp');
                    break;
                }
                case 'registerAttemptWithHelp': {
                    vscode.commands.executeCommand('vscode-cal.registerAttemptWithHelp');
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
				<div class="container">
					<div class="input-container">
						<input type="text" id="question-number" placeholder="Enter question number" />
					</div>
					<div class="button-container">
						<button id="preview-button" class="primary">Preview Question</button>
					</div>
					<div class="button-container">
						<button id="save-button" class="primary">Save Question</button>
					</div>
                    <div class="button-container">
                        <button id="register-attempt-without-help-button" class="secondary-green">Register attempt without help</button>
                    </div>
                    <div class="button-container">
                        <button id="register-attempt-with-help-button" class="secondary-yellow">Register attempt with help</button>
                    </div>
				</div>

				<script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const input = document.getElementById('question-number');
                    const previewButton = document.getElementById('preview-button');
                    const saveButton = document.getElementById('save-button');
                    const registerAttemptWithoutHelpButton = document.getElementById('register-attempt-without-help-button');
                    const registerAttemptWithHelpButton = document.getElementById('register-attempt-with-help-button');
                    
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

                    saveButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'saveQuestion' });
                    });

                    registerAttemptWithoutHelpButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'registerAttemptWithoutHelp' });
                    });

                    registerAttemptWithHelpButton.addEventListener('click', () => {
                        vscode.postMessage({ type: 'registerAttemptWithHelp' });
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