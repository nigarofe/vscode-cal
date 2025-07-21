import * as vscode from "vscode";
import { exportQuestionsJsonCommand } from "./exportQuestionsJson";
import { openQuestionByNumberCommand } from "./openQuestionByNumber";
import { previewQuestionCommand } from "./previewQuestion";
import { saveQuestionCommand } from "./saveQuestion";
import { registerAttemptCommand } from "./registerAttempt";
import { onDidChangeTextDocument } from "./onDidChangeTextDocument";
import { recommendQuestionCommand } from "./recommendQuestion";

export function registerCommands(context: vscode.ExtensionContext) {
    console.log("banana debug 0");
    context.subscriptions.push(exportQuestionsJsonCommand(context));
    console.log("banana debug 1");
    context.subscriptions.push(openQuestionByNumberCommand(context));
    console.log("banana debug 2");
    context.subscriptions.push(previewQuestionCommand(context));
    console.log("banana debug 3");
    context.subscriptions.push(saveQuestionCommand());
    context.subscriptions.push(registerAttemptCommand());
    context.subscriptions.push(recommendQuestionCommand(context));
    onDidChangeTextDocument(context);
}
