import * as vscode from "vscode";
import { getQuestions } from "../cache";
import { Question } from "../Question";
import * as path from "path";

export function showRankedQuestionsCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vscode-cal.showRankedQuestions', () => {

        getQuestions().then(questions => {
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
    `;
    }).join('');

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

                function getPmgxHighlightColor(pmgX, minPmg, maxPmg) {
                    if (typeof pmgX === 'string') {
                        switch (pmgX) {
                            case 'NA': return 'background-color: #F0F0F0;';
                            case 'SA': return 'background-color: #E6E0F8;';
                            case 'W/H': return 'background-color: #FFDDC1;';
                            default: return '';
                        }
                    }
                    if (pmgX <= 1) {
                        return 'background-color: #006400; color: white;';
                    }
                    const hue = 120 * (1 - (pmgX - minPmg) / (maxPmg - minPmg));
                    return 'background-color: hsl(' + hue + ', 100%, 85%);';
                }

                function updateRowColors(columnIndex) {
                    const table = document.getElementById('questionsTable');
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const numericColorCols = [0, 5, 6, 7];

                    rows.forEach(row => {
                        row.style.backgroundColor = '';
                        row.style.color = '';
                    });

                    if (columnIndex === 8) { // PMG-X
                        const pmgValues = rows.map(row => {
                            const text = row.cells[columnIndex].textContent.trim();
                            if (['NA', 'SA', 'W/H'].includes(text)) return text;
                            return parseFloat(text);
                        });
                        const numericPmgs = pmgValues.filter(v => typeof v === 'number' && v > 1);
                        const minPmg = Math.min(...numericPmgs);
                        const maxPmg = Math.max(...numericPmgs);

                        rows.forEach((row, i) => {
                            const style = getPmgxHighlightColor(pmgValues[i], minPmg, maxPmg);
                            row.setAttribute('style', "cursor: pointer; " + style);
                        });

                    } else if (numericColorCols.includes(columnIndex)) {
                        const values = rows.map(row => parseFloat(row.cells[columnIndex].textContent.trim())).filter(v => !isNaN(v));
                        const min = Math.min(...values);
                        const max = Math.max(...values);

                        rows.forEach(row => {
                            const value = parseFloat(row.cells[columnIndex].textContent.trim());
                            if (isNaN(value)) return;
                            const hue = 120 * (1 - (value - min) / (max - min));
                            row.style.backgroundColor = 'hsl(' + hue + ', 100%, 85%)';
                        });
                    }
                }

                function sortTable(columnIndex) {
                    const table = document.getElementById('questionsTable');
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const headers = table.querySelectorAll('th');

                    const direction = sortDirections[columnIndex] === 'asc' ? 'desc' : 'asc';
                    sortDirections = new Array(headers.length).fill(null);
                    sortDirections[columnIndex] = direction;
                    const directionMultiplier = direction === 'asc' ? 1 : -1;

                    rows.sort((a, b) => {
                        const aText = a.cells[columnIndex].textContent.trim();
                        const bText = b.cells[columnIndex].textContent.trim();

                        const aNum = parseFloat(aText);
                        const bNum = parseFloat(bText);
                        const isNumA = !isNaN(aNum);
                        const isNumB = !isNaN(bNum);

                        // Grouping logic: numbers always come before strings
                        if (isNumA && !isNumB) {
                            return -1;
                        }
                        if (!isNumA && isNumB) {
                            return 1;
                        }

                        // At this point, both are numbers or both are strings.
                        // Sort within the group based on type.
                        if (isNumA) { // Both are numbers
                            return (aNum - bNum) * directionMultiplier;
                        } else { // Both are strings
                            if (columnIndex === 8) { // Special string sort for PMG-X
                                const pmgOrder = { 'W/H': 1, 'SA': 2, 'NA': 3 };
                                const aVal = pmgOrder[aText] || 99;
                                const bVal = pmgOrder[bText] || 99;
                                return (aVal - bVal) * directionMultiplier;
                            }
                            // Standard string sort for other columns
                            return aText.toLowerCase().localeCompare(bText.toLowerCase()) * directionMultiplier;
                        }
                    });

                    headers.forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
                    headers[columnIndex].classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');

                    rows.forEach(row => tbody.appendChild(row));
                    updateRowColors(columnIndex);
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
