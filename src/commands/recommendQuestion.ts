import * as vscode from "vscode";
import * as path from "path";
import { buildAllQuestions } from "../db";
import { Question } from "../Question";

export function recommendQuestionCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand(
    "vscode-cal.recommendQuestion",
    async () => {
      const dbPath = path.join(context.extensionPath, "src", "db.db");
      try {
        const questions = await buildAllQuestions(dbPath);
        let recommendedQuestion: Question | null = null;
        let maxMultiplier = -1;

        for (const question of questions) {
          if (
            typeof question.potentialMemoryGainMultiplier === "number" &&
            question.potentialMemoryGainMultiplier > maxMultiplier
          ) {
            maxMultiplier = question.potentialMemoryGainMultiplier;
            recommendedQuestion = question;
          }
        }

        if (recommendedQuestion) {
          vscode.commands.executeCommand(
            "vscode-cal.openQuestionByNumber",
            recommendedQuestion.question_number
          );
        } else {
          vscode.window.showInformationMessage(
            "No questions available for recommendation."
          );
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
      }
    }
  );
}
