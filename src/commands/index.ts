import * as vscode from "vscode";
import { exportQuestionsJsonCommand } from "./exportQuestionsJson";
import { openQuestionByNumberCommand } from "./openQuestionByNumber";
import { previewQuestionCommand } from "./previewQuestion";
import { saveQuestionCommand } from "./saveQuestion";
import { registerAttemptWithoutHelpCommand } from "./registerAttemptWithoutHelp";
import { registerAttemptWithHelpCommand } from "./registerAttemptWithHelp";
import { onDidChangeTextDocument } from "./onDidChangeTextDocument";

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(exportQuestionsJsonCommand(context));
    context.subscriptions.push(openQuestionByNumberCommand(context));
    context.subscriptions.push(previewQuestionCommand(context));
    context.subscriptions.push(saveQuestionCommand());
    context.subscriptions.push(registerAttemptWithoutHelpCommand());
    context.subscriptions.push(registerAttemptWithHelpCommand());
    onDidChangeTextDocument(context);
}
