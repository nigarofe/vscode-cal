import * as vscode from "vscode";
import * as path from "path";
import { getQuestions } from "../questionCache";

export function exportQuestionsJsonCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand(
        "vscode-cal.exportQuestionsJson",
        async () => {
            try {
                const questions = await getQuestions();
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
                        attempts: q.attempts.map((attempt) => ({
                            datetime: attempt.date.toISOString(),
                            code: attempt.code,
                        })),
                        DSLA: q.daysSinceLastAttempt,
                        LaMI: q.latestMemoryInterval,
                        "PMG-D": q.potentialMemoryGainInDays,
                        "PMG-X": q.potentialMemoryGainMultiplier,
                        total_attempts: q.attemptsWithHelp + q.attemptsWithoutHelp,
                        memory_attempts: q.attemptsWithoutHelp,
                        help_attempts: q.attemptsWithHelp,
                        attempts_summary: q.attemptsSummary,
                    },
                }));

                const questionsAsJson = JSON.stringify(
                    { questions: questionsForJson },
                    null,
                    2
                );
                const jsonFolderPath = path.join(context.extensionPath, "src", ".json");

                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(jsonFolderPath));
                } catch (error) {
                    await vscode.workspace.fs.createDirectory(
                        vscode.Uri.file(jsonFolderPath)
                    );
                }

                const timestamp = new Date()
                    .toISOString()
                    .replace(/:/g, "-")
                    .replace(/\./, "_");
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
}
