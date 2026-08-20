import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

/**
 * gemini-embedding-001 returns 3072 dimensions — inside Atlas's 4096 limit.
 * Fixed deliberately: the vector index declares its dimensions up front, so
 * changing the embedding model means rebuilding the index, not just swapping
 * a string. (text-embedding-004 is no longer served on v1beta.)
 */
export const EMBEDDING_DIMENSIONS = 3072;

let cached = null;

export function embeddings() {
    if (cached) return cached;
    cached = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
    });
    return cached;
}
