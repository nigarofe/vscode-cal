import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import matter from "gray-matter";
import { buildAllQuestions } from "./db";
import { getWebviewContent } from "./webview";
import { updateDiagnostics } from "./diagnostics";

export function registerCommands(context: vscode.ExtensionContext) {
    const exportQuestionsJsonCommand = vscode.commands.registerCommand(
        "vscode-cal.exportQuestionsJson",
        async () => {
            const dbPath = path.join(context.extensionPath, "src", "db.db");
            try {
                const questions = await buildAllQuestions(dbPath);
                const questionsForJson = questions.map((q) => ({
                    number: q.question_number,
                    discipline: q.discipline,
                    source: q.source,
                    description: q.description,
                    proposition: q.proposition,
                    "step-by-step": q.step_by_step,
                    answer: q.answer,
                    tags: q.tags,
                    spaced_repetition_variables: {
                        attempts: q.attempts.map(attempt => ({
                            datetime: attempt.date.toISOString(),
                            code: attempt.code
                        })),
                        DSLA: q.daysSinceLastAttempt,
                        LaMI: q.latestMemoryInterval,
                        "PMG-D": q.potentialMemoryGainInDays,
                        "PMG-X": q.potentialMemoryGainMultiplier,
                        total_attempts: q.attemptsSummary.total,
                        memory_attempts: q.attemptsSummary.withoutHelp,
                        help_attempts: q.attemptsSummary.withHelp,
                        attempts_summary: `${q.attemptsSummary.total};${q.attemptsSummary.withoutHelp};${q.attemptsSummary.withHelp}`,
                    },
                }));

                const questionsAsJson = JSON.stringify(
                    { questions: questionsForJson },
                    null,
                    2
                );
                const jsonFolderPath = path.join(
                    context.extensionPath,
                    "src",
                    ".json"
                );

                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(jsonFolderPath));
                } catch (error) {
                    await vscode.workspace.fs.createDirectory(
                        vscode.Uri.file(jsonFolderPath)
                    );
                }

                const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./, '_');
                const filePath = path.join(
                    jsonFolderPath,
                    `${timestamp}_questions.json`
                );
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(filePath),
                    Buffer.from(questionsAsJson, "utf8")
                );
                vscode.window.showInformationMessage(
                    `Successfully exported questions to ${filePath}`
                );
            } catch (error: any) {
                vscode.window.showErrorMessage(error);
            }
        }
    );

    context.subscriptions.push(exportQuestionsJsonCommand);

    const openQuestionByNumberCommand = vscode.commands.registerCommand(
        "vscode-cal.openQuestionByNumber",
        async () => {
            const questionNumberStr = await vscode.window.showInputBox({
                prompt: "Enter the question number",
                placeHolder: "e.g., 1",
                validateInput: (text) => {
                    return /^\d+$/.test(text) ? null : "Please enter a valid number.";
                },
            });

            if (questionNumberStr) {
                const questionNumber = parseInt(questionNumberStr, 10);
                const dbPath = path.join(context.extensionPath, "src", "db.db");
                try {
                    const questions = await buildAllQuestions(dbPath);
                    const question = questions.find(
                        (q) => q.question_number === questionNumber
                    );

                    if (question) {
                        const tempDir = path.join(context.extensionPath, "temp");
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir);
                        }
                        const tempFile = path.join(tempDir, `question-${question.question_number}.md`);

                        const frontMatter = {
                            discipline: question.discipline,
                            source: question.source,
                            tags: question.tags
                        };

                        const content = `---${Object.entries(frontMatter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}---\n\n# Question: ${question.question_number}\n\n## Description\n${question.description}\n\n## Proposition\n${question.proposition}\n\n## Answer\n${question.answer}\n\n## Step-by-step\n${question.step_by_step || ""}\n`;
                        fs.writeFileSync(tempFile, content);
                        const doc = await vscode.workspace.openTextDocument(tempFile);
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

    context.subscriptions.push(openQuestionByNumberCommand);

    let panel: vscode.WebviewPanel | undefined = undefined;
    let debounce: NodeJS.Timeout | undefined = undefined;

    const previewQuestionCommand = vscode.commands.registerCommand(
        "vscode-cal.previewQuestion",
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No active editor");
                return;
            }

            if (panel) {
                panel.reveal(vscode.ViewColumn.Two);
            } else {
                panel = vscode.window.createWebviewPanel(
                    "questionPreview",
                    "Question Preview",
                    vscode.ViewColumn.Two,
                    {
                        enableScripts: true,
                    }
                );

                panel.onDidDispose(
                    () => {
                        panel = undefined;
                    },
                    null,
                    context.subscriptions
                );
            }

            panel.webview.html = getWebviewContent(
                editor.document.getText(),
                panel,
                context
            );
        }
    );
    context.subscriptions.push(previewQuestionCommand);

    vscode.workspace.onDidChangeTextDocument((event) => {
        if (panel && event.document === vscode.window.activeTextEditor?.document) {
            if (debounce) {
                clearTimeout(debounce);
            }
            debounce = setTimeout(() => {
                panel!.webview.html = getWebviewContent(
                    event.document.getText(),
                    panel!,
                    context
                );
            }, 300);
        }
    });
}