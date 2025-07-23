import { Question } from "./Question";
import { buildAllQuestions } from "./db";

// The cache is stored in this private, module-level variable.
let cachedQuestions: Question[] | null = null;

/**
 * Retrieves all questions, using the cache if available.
 * If the cache is empty, it populates it by calling buildAllQuestions.
 */
export async function getQuestions(): Promise<Question[]> {
    if (cachedQuestions === null) {
        console.log("CACHE MISS: Building questions from DB...");
        cachedQuestions = await buildAllQuestions();
    } else {
        console.log("CACHE HIT: Returning cached questions.");
    }
    return cachedQuestions;
}

/**
 * Clears the cache. This should be called whenever the underlying data changes.
 */
export function clearCache(): void {
    console.log("CACHE CLEARED.");
    cachedQuestions = null;
}