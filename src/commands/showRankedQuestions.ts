import * as vscode from "vscode";
import { buildAllQuestions } from "../db";
import { Question } from "../Question";
import * as path from "path";

export function showRankedQuestionsCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vscode-cal.showRankedQuestions', () => {
        const dbPath = path.resolve(__dirname, "../../src/db.db");

        buildAllQuestions(dbPath).then(questions => {
            // Filter out questions where potentialMemoryGainMultiplier is not a number
            // const sortedQuestions = questions.filter(q => typeof q.potentialMemoryGainMultiplier === 'number');
            const sortedQuestions = questions;

            // Sort questions by potential memory gain multiplier in descending order
            sortedQuestions.sort((a, b) => (b.potentialMemoryGainMultiplier as number) - (a.potentialMemoryGainMultiplier as number));

            const panel = vscode.window.createWebviewPanel(
                'rankedQuestions',
                'Ranked Questions by Memory Gain',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = getWebviewContent(sortedQuestions);

            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'openQuestionByNumber':
                            vscode.commands.executeCommand('vscode-cal.openQuestionByNumber', message.questionNumber);
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );
        }).catch(err => {
            vscode.window.showErrorMessage("Failed to build questions: " + err);
        });
    });
}

function getWebviewContent(questions: Question[]): string {
    const tableHeaders = [
        "#",
        "Discipline",
        "Source",
        "Description",
        "Attempts Summary",
        "DSLA",
        "LaMI",
        "PMG-D",
        "PMG-X",
    ];

    const headerHtml = tableHeaders.map(header => `<th>${header}</th>`).join('');

    const rows = questions.map(q => `
        <tr data-question-number="${q.question_number}" style="cursor: pointer;">
            <td>${q.question_number}</td>
            <td>${q.discipline}</td>
            <td>${q.source}</td>
            <td>${q.description}</td>
            <td>${q.attemptsSummary}</td>
            <td>${q.daysSinceLastAttempt}</td>
            <td>${q.latestMemoryInterval}</td>
            <td>${q.potentialMemoryGainInDays}</td>
            <td>${q.potentialMemoryGainMultiplier}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ranked Questions</title>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                tr:hover {
                    background-color: #f5f5f5;
                }
            </style>
        </head>
        <body>
            <h1>Questions Ranked by PMG-X ${rows.length}</h1>
            <table>
                <thead>
                    <tr>
                        ${headerHtml}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <script>
                const vscode = acquireVsCodeApi();
                document.querySelectorAll('tr[data-question-number]').forEach(row => {
                    row.addEventListener('click', event => {
                        const questionNumber = row.dataset.questionNumber;
                        if (questionNumber) {
                            vscode.postMessage({
                                command: 'openQuestionByNumber',
                                questionNumber: parseInt(questionNumber)
                            });
                        }
                    });
                });
            </script>
        </body>
        </html>
    `;
}
