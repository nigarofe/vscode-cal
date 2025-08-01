import * as vscode from "vscode";
import { createQuestionCommand } from "./createQuestion";
import { exportQuestionsJsonCommand } from "./exportQuestionsJson";
import { openQuestionByNumberCommand } from "./openQuestionByNumber";
import { previewQuestionCommand } from "./previewQuestion";
import { saveQuestionCommand } from "./saveQuestion";
import { registerAttemptCommand } from "./registerAttempt";
import { onDidChangeTextDocument } from "./onDidChangeTextDocument";
import { recommendQuestionCommand } from "./recommendQuestion";
import { showRankedQuestionsCommand } from "./showRankedQuestions";

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(createQuestionCommand(context));
    context.subscriptions.push(exportQuestionsJsonCommand(context));
    context.subscriptions.push(openQuestionByNumberCommand());
    context.subscriptions.push(previewQuestionCommand(context));
    context.subscriptions.push(saveQuestionCommand(context));
    context.subscriptions.push(registerAttemptCommand());
    context.subscriptions.push(recommendQuestionCommand(context));
    context.subscriptions.push(showRankedQuestionsCommand(context));
    onDidChangeTextDocument(context);
}
