import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as commands from '../commands/commandsLoader';
import * as db from '../db';
import * as diagnostics from '../diagnostics';
import { Question } from '../Question';

suite('Question Management Commands', () => {
    let showInputBoxStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;
    let buildAllQuestionsStub: sinon.SinonStub;
    let openTextDocumentStub: sinon.SinonStub;
    let showTextDocumentStub: sinon.SinonStub;
    let updateDiagnosticsStub: sinon.SinonStub;

    suiteSetup(() => {
        // Stub vscode functions that are used across tests
        showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
        showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
        openTextDocumentStub = sinon.stub(vscode.workspace, 'openTextDocument');
        showTextDocumentStub = sinon.stub(vscode.window, 'showTextDocument');
        buildAllQuestionsStub = sinon.stub(db, 'buildAllQuestions');
        updateDiagnosticsStub = sinon.stub(diagnostics, 'updateDiagnostics');

        // Register commands once
        const tempContext = { subscriptions: [], extensionPath: '/mock/path' } as any;
        commands.registerCommands(tempContext);
    });

    suiteTeardown(() => {
        sinon.restore();
    });

    teardown(() => {
        // Reset the state of the stubs
        showInputBoxStub.reset();
        showErrorMessageStub.reset();
        buildAllQuestionsStub.reset();
        openTextDocumentStub.reset();
        showTextDocumentStub.reset();
        updateDiagnosticsStub.reset();
    });

    suite('openQuestionByNumber', () => {
        test('should not show an error when input is cancelled', async () => {
            showInputBoxStub.resolves(undefined);

            await vscode.commands.executeCommand('vscode-cal.openQuestionByNumber');

            assert.strictEqual(showErrorMessageStub.called, false, 'showErrorMessage was called unexpectedly');
        });

        test('should show an error if the question number does not exist', async () => {
            const nonExistentQuestionNumber = '9999';
            showInputBoxStub.resolves(nonExistentQuestionNumber);
            buildAllQuestionsStub.resolves([]); // No questions found

            await vscode.commands.executeCommand('vscode-cal.openQuestionByNumber');

            assert.ok(
                showErrorMessageStub.calledWith(`Question number ${nonExistentQuestionNumber} not found.`),
                'Error message for non-existent question was not shown'
            );
        });

        test('should open a new markdown editor with the question content on success', async () => {
            const questionNumber = '1';
            const mockQuestionData = {
                question_number: 1,
                discipline: 'Math',
                source: 'Test Book',
                description: 'A test question',
                proposition: 'What is 2+2?',
                step_by_step: 'First, take 2. Then, add 2.',
                answer: '4',
                tags: 'calculus, easy',
                code_vec_json: '[1]',
                date_vec_json: '["2025-07-20T12:00:00.000Z"]'
            };
            const mockQuestion = new Question(mockQuestionData);

            showInputBoxStub.resolves(questionNumber);
            buildAllQuestionsStub.resolves([mockQuestion]);
            openTextDocumentStub.resolves({} as vscode.TextDocument);
            showTextDocumentStub.resolves({} as vscode.TextEditor);

            await vscode.commands.executeCommand('vscode-cal.openQuestionByNumber');

            assert.ok(openTextDocumentStub.calledOnce, 'openTextDocument was not called');
            assert.ok(showTextDocumentStub.calledOnce, 'showTextDocument was not called');
            assert.strictEqual(showErrorMessageStub.called, false, 'showErrorMessage was called unexpectedly on success');

            const contentArg = openTextDocumentStub.firstCall.args[0].content;
            assert.ok(contentArg.includes(`# Question ${mockQuestion.question_number}`), 'Content does not contain question number');
            assert.ok(contentArg.includes(`discipline: ${JSON.stringify(mockQuestion.discipline)}`), 'Content does not contain discipline');
            assert.ok(contentArg.includes(`## Proposition\n${mockQuestion.proposition}`), 'Content does not contain proposition');
        });
    });
});
