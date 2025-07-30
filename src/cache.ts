import { Question } from "./Question";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import * as vscode from "vscode";
import { GET_QUESTIONS_SQL } from "./db_sql_queries";

class Cache {
    private questionsCache: Question[] | null = null;
    private snippetCache = new Map<string, string>();

    async getQuestions(): Promise<Question[]> {
        if (this.questionsCache === null) {
            console.log("CACHE MISS: Building questions and snippets from DB...");
            this.questionsCache = await this.buildQuestionsCache();
            this.buildSnippetCache(this.questionsCache);
        } else {
            console.log("CACHE HIT: Returning cached questions.");
        }
        return this.questionsCache;
    }

    getSnippetById(id: string): string | undefined {
        return this.snippetCache.get(id);
    }

    async rebuildCache(): Promise<void> {
        console.log("REBUILDING CACHE: Clearing and building questions and snippets from DB...");
        this.questionsCache = null;
        this.snippetCache.clear();
        this.questionsCache = await this.buildQuestionsCache();
        this.buildSnippetCache(this.questionsCache);
    }

    private async buildQuestionsCache(): Promise<Question[]> {
        const dbPath = path.join(
            vscode.extensions.getExtension("Nicholas.vscode-cal")!.extensionPath,
            "db.db"
        );
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    reject(`Error opening database: ${err.message}`);
                }
            });

            db.all(GET_QUESTIONS_SQL, [], (err, rows: any[]) => {
                if (err) {
                    reject(`Error querying database: ${err.message}`);
                } else {
                    const questions = rows.map((row) => new Question(row));
                    resolve(questions);
                }
                db.close();
            });
        });
    }

    private buildSnippetCache(questions: Question[]): void {
        this.snippetCache.clear();

        const snippetRegex = /<snippet id="(.+?)">([\s\S]*?)<\/snippet>/g;

        for (const question of questions) {
            const contentToSearch = this.getQuestionSearchContent(question);
            let match;

            while ((match = snippetRegex.exec(contentToSearch)) !== null) {
                const [, id, content] = match;
                if (this.snippetCache.has(id.trim())) {
                    console.warn(`Duplicate snippet ID found: "${id.trim()}". Overwriting.`);
                }
                this.snippetCache.set(id.trim(), content);
            }

            // Reset regex lastIndex for next question
            snippetRegex.lastIndex = 0;
        }
        console.log(`Snippet cache built with ${this.snippetCache.size} items.`);
        // Log the first item in the snippetCache, if any
        const firstEntry = this.snippetCache.entries().next();
        if (!firstEntry.done) {
            const [firstKey, firstValue] = firstEntry.value;
            console.log(`First snippet: id="${firstKey}", content="${firstValue}"`);
        }
    }

    private getQuestionSearchContent(question: Question): string {
        return [
            question.proposition,
            question.step_by_step,
            question.answer
        ].join('\n');
    }
}

// Create a singleton instance
const cache = new Cache();

// Export the methods from the singleton instance for backward compatibility
export async function getQuestions(): Promise<Question[]> {
    return cache.getQuestions();
}

export function getSnippetById(id: string): string | undefined {
    return cache.getSnippetById(id);
}

export async function rebuildCache(): Promise<void> {
    return cache.rebuildCache();
}