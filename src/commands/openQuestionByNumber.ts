import * as vscode from "vscode";
import * as path from "path";
import { buildAllQuestions } from "../db";
import { updateDiagnostics } from "../diagnostics";

export function openQuestionByNumberCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.openQuestionByNumber",
        async (questionNumber?: number) => {
            let questionNumberStr: string | undefined;

            if (questionNumber === undefined) {
                questionNumberStr = await vscode.window.showInputBox({
                    prompt: "Enter the question number",
                    placeHolder: "e.g., 1",
                    validateInput: (text) => {
                        return /^\d+$/.test(text) ? null : "Please enter a valid number.";
                    },
                });
            } else {
                questionNumberStr = questionNumber.toString();
            }

            if (questionNumberStr) {
                const questionNumber = parseInt(questionNumberStr, 10);
                const dbPath = path.join(context.extensionPath, "src", "db.db");
                try {
                    const questions = await buildAllQuestions(dbPath);
                    const question = questions.find(
                        (q) => q.question_number === questionNumber
                    );

                    if (question) {
                        const frontMatter = {
                            discipline: question.discipline,
                            description: question.description,
                            source: question.source,
                            tags: question.tags,
                        };

                        const content =
                            `---\n` +
                            `${Object.entries(frontMatter)
                                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                                .join("\n")}\n` +
                            `---\n\n` +
                            `# Question ${question.question_number}\n\n` +
                            `## Proposition\n${question.proposition}\n\n` +
                            `## Step-by-step\n${question.step_by_step || ""}\n\n` +
                            `## Answer\n${question.answer}\n\n`;

                        const doc = await vscode.workspace.openTextDocument({
                            content: content,
                            language: "markdown",
                        });
                        await vscode.window.showTextDocument(doc);
                        updateDiagnostics(doc);
                    } else {
                        vscode.window.showErrorMessage(
                            `Question number ${questionNumber} not found.`
                        );
                    }
                } catch (error: any) {
                    vscode.window.showErrorMessage(error.message);
                }
            }
        }
    );
}