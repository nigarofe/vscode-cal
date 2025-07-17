import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-cal" is now active!');

	const disposable = vscode.commands.registerCommand('vscode-cal.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-cal!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
