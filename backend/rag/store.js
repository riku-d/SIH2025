import mongoose from 'mongoose';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { SimpleMemoryVectorStore } from './memoryStore.js';
import { embeddings, EMBEDDING_DIMENSIONS } from './embeddings.js';

export const COLLECTION = 'rag_chunks';
export const INDEX_NAME = 'gramsathi_vector_index';

/**
 * Atlas Vector Search where the cluster supports it, an in-memory store
 * where it does not.
 *
 * The fallback is not a compromise at our size: the whole corpus is a few
 * hundred chunks, which fits in memory comfortably and searches in
 * milliseconds. What Atlas buys us is surviving a restart and filtering by
 * patientId inside the query rather than after it.
 */
let storePromise = null;
let mode = 'unknown';

export const storeMode = () => mode;

async function collection() {
    const db = mongoose.connection.db;

    // The index cannot be created on a namespace that does not exist yet.
    const names = await db.listCollections({ name: COLLECTION }).toArray();
    if (!names.length) await db.createCollection(COLLECTION).catch(() => {});

    const col = db.collection(COLLECTION);

    /**
     * @langchain/mongodb expects driver v7, where a Collection exposes
     * `.db.client`. Mongoose 8 pins driver v6, where it does not — so the
     * store crashes on construction. Bridging the one property it reads is
     * far safer than forcing a driver upgrade underneath mongoose.
     */
    if (!col.db) {
        Object.defineProperty(col, 'db', {
            value: { client: mongoose.connection.getClient() },
            configurable: true
        });
    }
    return col;
}

/** Creates the vector index if it is missing. Safe to call repeatedly. */
export async function ensureVectorIndex() {
    const col = await collection();
    const existing = await col.listSearchIndexes().toArray();
    if (existing.some(i => i.name === INDEX_NAME)) return 'exists';

    await col.createSearchIndex({
        name: INDEX_NAME,
        type: 'vectorSearch',
        definition: {
            fields: [
                { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMENSIONS, similarity: 'cosine' },
                // Filter fields must be declared, or $vectorSearch rejects
                // the filter — and patient scoping depends on it.
                { type: 'filter', path: 'kind' },
                { type: 'filter', path: 'patientId' }
            ]
        }
    });
    return 'created';
}

export async function getStore() {
    if (storePromise) return storePromise;

    storePromise = (async () => {
        try {
            const col = await collection();
            const indexes = await col.listSearchIndexes().toArray(); // throws off Atlas
            if (!indexes.some(i => i.name === INDEX_NAME)) {
                throw new Error(`vector index ${INDEX_NAME} not built yet — run npm run rag:ingest`);
            }
            mode = 'atlas';
            return new MongoDBAtlasVectorSearch(embeddings(), {
                collection: col,
                indexName: INDEX_NAME,
                textKey: 'text',
                embeddingKey: 'embedding'
            });
        } catch (err) {
            console.warn('Atlas Vector Search unavailable, using in-memory store:', err.codeName || err.message);
            mode = 'memory';
            return new SimpleMemoryVectorStore(embeddings());
        }
    })();

    return storePromise;
}

/** Only used by the memory fallback, which starts empty on every boot. */
export async function seedMemoryStore(documents) {
    const store = await getStore();
    if (mode !== 'memory') return false;
    await store.addDocuments(documents);
    return true;
}
