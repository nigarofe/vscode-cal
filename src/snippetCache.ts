import { Question } from "./Question";

// The cache remains a simple map of snippet ID to its content.
const snippetCache = new Map<string, string>();

export function updateSnippetCacheFromText(text: string): void {
    const snippetRegex = /<snippet id="(.+?)">([\s\S]*?)<\/snippet>/g;
    let match;
    while ((match = snippetRegex.exec(text)) !== null) {
        const [, id, content] = match;
        if (snippetCache.has(id.trim())) {
            console.warn(`Duplicate snippet ID found: "${id.trim()}". Overwriting.`);
        }
        snippetCache.set(id.trim(), content);
    }
}

export function buildSnippetCache(questions: Question[]): void {
    snippetCache.clear();

    for (const question of questions) {
        // Combine all text fields where a snippet could be defined
        const contentToSearch = [
            question.proposition,
            question.step_by_step,
            question.answer
        ].join('\n');

        updateSnippetCacheFromText(contentToSearch);
    }
    console.log(`Snippet cache built with ${snippetCache.size} items.`);
}

/**
 * Retrieves a snippet's content by its ID from the cache.
 */
export function getSnippetById(id: string): string | undefined {
    return snippetCache.get(id);
}
