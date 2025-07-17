import * as vscode from "vscode";
import * as path from "path";
import matter from "gray-matter";

export const diagnosticsCollection =
  vscode.languages.createDiagnosticCollection("question");

export function updateDiagnostics(document: vscode.TextDocument) {
  if (!path.basename(document.fileName).startsWith("question-")) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  try {
    const parsed = matter(text);

    // Front matter validation
    if (!parsed.data.discipline) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter is missing the 'discipline' field.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    if (!parsed.data.source) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter is missing the 'source' field.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    if (!parsed.data.tags || !Array.isArray(parsed.data.tags)) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          "Front matter must have 'tags' as an array.",
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    // Body validation
    const questionNumberMatch = path
      .basename(document.fileName)
      .match(/question-(\d+)\.md/);
    if (!questionNumberMatch) {
      return;
    }
    const questionNumber = questionNumberMatch[1];

    const requiredHeadings = [
      "# Question",
      "## Proposition",
      "## Step-by-step",
      "## Answer",
    ];
    for (const heading of requiredHeadings) {
      if (heading === "# Question") {
        const headingRegex = new RegExp(`^# Question ${questionNumber}`, "im");

        if (!headingRegex.test(text)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(0, 0, document.lineCount - 1, 1),
              `Markdown body is missing the '# Question ${questionNumber}' heading.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      } else {
        const headingRegex = new RegExp(`^${heading}(\s|$)`, "im");
        if (!headingRegex.test(text)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(0, 0, document.lineCount - 1, 1),
              `Markdown body is missing the '${heading}' heading.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
    }
  } catch (e: any) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 1),
        `Error parsing front matter: ${e.message}`,
        vscode.DiagnosticSeverity.Error
      )
    );
  }

  diagnosticsCollection.set(document.uri, diagnostics);
}
