import { embeddings } from './embeddings.js';

/**
 * Minimal in-memory vector store — cosine similarity over an array.
 *
 * LangChain v1 moved MemoryVectorStore out of core, and pulling in another
 * package for thirty lines of dot product is a poor trade three days before
 * a demo. Exposes only the two methods the retriever uses, so it drops into
 * the same slot as the Atlas store.
 */
export class SimpleMemoryVectorStore {
    constructor(embedder = embeddings()) {
        this.embedder = embedder;
        this.entries = [];
    }

    async addDocuments(documents) {
        const vectors = await this.embedder.embedDocuments(documents.map(d => d.pageContent));
        documents.forEach((doc, i) => {
            this.entries.push({ doc, vector: vectors[i], norm: magnitude(vectors[i]) });
        });
    }

    async similaritySearch(query, k = 4, filter) {
        if (!this.entries.length) return [];
        const q = await this.embedder.embedQuery(query);
        const qNorm = magnitude(q);

        const pool = filter?.kinds
            ? this.entries.filter(e => filter.kinds.includes(e.doc.metadata?.kind))
            : this.entries;

        return pool
            .map(e => ({ doc: e.doc, score: dot(q, e.vector) / ((qNorm * e.norm) || 1) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map(r => r.doc);
    }

    get size() { return this.entries.length; }
}

const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const magnitude = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
