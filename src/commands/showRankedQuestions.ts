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
            sortedQuestions.sort((a, b) => {
                const pmgA = a.potentialMemoryGainMultiplier;
                const pmgB = b.potentialMemoryGainMultiplier;

                const isNumA = typeof pmgA === 'number';
                const isNumB = typeof pmgB === 'number';

                if (isNumA && isNumB) {
                    return pmgB - pmgA;
                }
                if (isNumA) {
                    return -1; // A (number) comes before B (string)
                }
                if (isNumB) {
                    return 1; // B (number) comes after A (string)
                }

                // Both are strings, sort based on a predefined order
                const stringOrder = ['W/H', 'SA', 'NA'];
                const indexA = stringOrder.indexOf(pmgA as string);
                const indexB = stringOrder.indexOf(pmgB as string);

                return indexA - indexB;
            });

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

    const numericPmgs = questions
        .map(q => q.potentialMemoryGainMultiplier)
        .filter(pmg => typeof pmg === 'number' && pmg > 1) as number[];
    
    const minPmg = Math.min(...numericPmgs);
    const maxPmg = Math.max(...numericPmgs);

    const rows = questions.map(q => {
        const pmgX = q.potentialMemoryGainMultiplier;
        const colorStyle = getHighlightColor(pmgX, minPmg, maxPmg);
        
        return `
        <tr data-question-number="${q.question_number}" style="cursor: pointer; ${colorStyle}">
            <td>${q.question_number}</td>
            <td>${q.discipline}</td>
            <td>${q.source}</td>
            <td>${q.description}</td>
            <td>${q.attemptsSummary}</td>
            <td>${q.daysSinceLastAttempt}</td>
            <td>${q.latestMemoryInterval}</td>
            <td>${q.potentialMemoryGainInDays}</td>
            <td>${pmgX}</td>
        </tr>
    `}).join('');

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
                    cursor: pointer;
                    user-select: none;
                }
                th.sort-asc::after {
                    content: ' ▲';
                }
                th.sort-desc::after {
                    content: ' ▼';
                }
                tr:hover {
                    background-color: #f5f5f5 !important;
                    color: black !important;
                }
            </style>
        </head>
        <body>
            <h1>Questions Ranked by PMG-X ${rows.length}</h1>
            <table id="questionsTable">
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

                document.querySelectorAll('#questionsTable th').forEach((header, index) => {
                    header.addEventListener('click', () => {
                        sortTable(index);
                    });
                });

                let sortDirections = [];

                function sortTable(columnIndex) {
                    const table = document.getElementById('questionsTable');
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const headers = table.querySelectorAll('th');

                    const direction = sortDirections[columnIndex] === 'asc' ? 'desc' : 'asc';
                    sortDirections = new Array(headers.length).fill(null); // Reset other directions
                    sortDirections[columnIndex] = direction;

                    // Special sort for PMG-X column (index 8)
                    if (columnIndex === 8) {
                        const pmgOrder = { 'W/H': 1, 'SA': 2, 'NA': 3 };
                        rows.sort((a, b) => {
                            const aText = a.cells[columnIndex].textContent.trim();
                            const bText = b.cells[columnIndex].textContent.trim();

                            const isNumA = !isNaN(parseFloat(aText));
                            const isNumB = !isNaN(parseFloat(bText));

                            if (isNumA && isNumB) {
                                return parseFloat(aText) - parseFloat(bText);
                            }
                            if (isNumA) return -1;
                            if (isNumB) return 1;
                            
                            return (pmgOrder[aText] || 99) - (pmgOrder[bText] || 99);
                        });

                        if (direction === 'desc') {
                            rows.reverse();
                        }

                    } else {
                        rows.sort((a, b) => {
                            const aText = a.cells[columnIndex].textContent.trim();
                            const bText = b.cells[columnIndex].textContent.trim();

                            const aNum = parseFloat(aText);
                            const bNum = parseFloat(bText);

                            let valA, valB;

                            if (!isNaN(aNum) && !isNaN(bNum)) {
                                valA = aNum;
                                valB = bNum;
                            } else {
                                valA = aText.toLowerCase();
                                valB = bText.toLowerCase();
                            }
                            
                            if (valA < valB) return -1;
                            if (valA > valB) return 1;
                            return 0;
                        });

                        if (direction === 'desc') {
                            rows.reverse();
                        }
                    }

                    headers.forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
                    headers[columnIndex].classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');

                    rows.forEach(row => tbody.appendChild(row));
                }
            </script>
        </body>
        </html>
    `;
}

function getHighlightColor(pmgX: number | string, minPmg: number, maxPmg: number): string {
    if (typeof pmgX === 'string') {
        switch (pmgX) {
            case 'NA':
                return 'background-color: #F0F0F0;'; // light grey for Not Applicable
            case 'SA':
                return 'background-color: #E6E0F8;'; // light purple for Single Attempt
            case 'W/H':
                return 'background-color: #FFDDC1;'; // light orange for With Help
            default:
                return '';
        }
    }

    if (pmgX <= 1) {
        return 'background-color: #006400; color: white;'; // dark green for pmgX <= 1
    }

    // Scale from green (120) to red (0)
    // To make the scale more sensitive to higher values, we can use a non-linear transformation if needed.
    // For now, a linear scale is implemented.
    const hue = 120 * (1 - (pmgX - minPmg) / (maxPmg - minPmg));
    return `background-color: hsl(${hue}, 100%, 85%);`;
}
