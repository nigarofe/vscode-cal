import { Question } from "./Question";

class SnippetManager {
    private snippets = new Map<string, string>();

    public parseAndRegisterSnippets(content: string): void {
        const snippetRegex = /<snippet id="([^"]+)">([\s\S]*?)<\/snippet>/g;
        let match;
        while ((match = snippetRegex.exec(content)) !== null) {
            const id = match[1];
            const snippetContent = match[2];
            this.snippets.set(id, snippetContent);
        }
    }

    public replaceReferences(content: string): string {
        const refRegex = /<ref src="([^"]+)"\s*\/>/g;
        return content.replace(refRegex, (match, id) => {
            return this.snippets.get(id) || `Snippet with id "${id}" not found.`;
        });
    }

    public processAllQuestions(questions: Question[]): void {
        // First, parse all questions and register all snippets.
        for (const question of questions) {
            this.parseAndRegisterSnippets(question.content);
        }

        // Now, replace all references in all questions.
        for (const question of questions) {
            question.content = this.replaceReferences(question.content);
        }
    }
}

export const snippetManager = new SnippetManager();
