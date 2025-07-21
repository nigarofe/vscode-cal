import * as vscode from "vscode";
import { exportQuestionsJsonCommand } from "./exportQuestionsJson";
import { openQuestionByNumberCommand } from "./openQuestionByNumber";
import { previewQuestionCommand } from "./previewQuestion";
import { saveQuestionCommand } from "./saveQuestion";
import { registerAttemptCommand } from "./registerAttempt";
import { onDidChangeTextDocument } from "./onDidChangeTextDocument";
import { recommendQuestionCommand } from "./recommendQuestion";

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(exportQuestionsJsonCommand(context));
    context.subscriptions.push(openQuestionByNumberCommand(context));
    context.subscriptions.push(previewQuestionCommand(context));
    context.subscriptions.push(saveQuestionCommand());
    context.subscriptions.push(registerAttemptCommand());
    context.subscriptions.push(recommendQuestionCommand(context));
    onDidChangeTextDocument(context);
}
