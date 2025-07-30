import { Question } from "./Question";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import { GET_QUESTIONS_SQL } from "./db_sql_queries";

let questionsCache: Question[] | null = null;
const snippetCache = new Map<string, string>();

export async function getQuestions(): Promise<Question[]> {
    if (questionsCache === null) {
        console.log("CACHE MISS: Building questions and snippets from DB...");
        questionsCache = await buildQuestionsCache();
        buildSnippetCache(questionsCache);
    } else {
        console.log("CACHE HIT: Returning cached questions.");
    }
    return questionsCache;
}

export function getSnippetById(id: string): string | undefined {
    return snippetCache.get(id);
}


export async function rebuildCache(): Promise<void> {
    console.log("REBUILDING CACHE: Clearing and building questions and snippets from DB...");
    questionsCache = null;
    snippetCache.clear();
    questionsCache = await buildQuestionsCache();
    buildSnippetCache(questionsCache);
}


async function buildQuestionsCache(): Promise<Question[]> {
    const dbPath = path.resolve(__dirname, "../db.db");
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

function buildSnippetCache(questions: Question[]): void {
    snippetCache.clear();

    const snippetRegex = /<snippet id="(.+?)">([\s\S]*?)<\/snippet>/g;

    for (const question of questions) {
        const contentToSearch = getQuestionSearchContent(question);
        let match;

        while ((match = snippetRegex.exec(contentToSearch)) !== null) {
            const [, id, content] = match;
            if (snippetCache.has(id.trim())) {
                console.warn(`Duplicate snippet ID found: "${id.trim()}". Overwriting.`);
            }
            snippetCache.set(id.trim(), content);
        }

        // Reset regex lastIndex for next question
        snippetRegex.lastIndex = 0;
    }
    console.log(`Snippet cache built with ${snippetCache.size} items.`);
    // Log the first item in the snippetCache, if any
    const firstEntry = snippetCache.entries().next();
    if (!firstEntry.done) {
        const [firstKey, firstValue] = firstEntry.value;
        console.log(`First snippet: id="${firstKey}", content="${firstValue}"`);
    }
}

function getQuestionSearchContent(question: Question): string {
    return [
        question.proposition,
        question.step_by_step,
        question.answer
    ].join('\n');
}