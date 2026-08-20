import { getStore, storeMode } from './store.js';
import { patientRecordDocuments } from './documents.js';

const TOP_K = 4;

/**
 * Retrieval for one turn.
 *
 * Patient history is fetched by patientId directly rather than through the
 * vector search. Scoping is then a database query we control, not a filter
 * we hope the index applied — a vector search that returns another
 * patient's diagnosis is the one bug that would end this project.
 */
export async function retrieveContext({ query, patientId, limit = TOP_K }) {
    if (!query || query.trim().length < 3) return { text: '', citations: [] };

    const results = [];

    try {
        const store = await getStore();
        // Only shared knowledge lives in the vector store; records never do.
        const hits = await store.similaritySearch(query, limit, storeMode() === 'atlas'
            ? { preFilter: { kind: { $in: ['reference', 'medicine'] } } }
            : { kinds: ['reference', 'medicine'] });

        for (const doc of hits) {
            if (doc.metadata?.kind === 'record') continue; // belt and braces
            results.push(doc);
        }
    } catch (err) {
        // Retrieval is an enhancement. An answer without it beats no answer.
        console.warn('Vector retrieval failed, answering without it:', err.message);
    }

    let records = [];
    try {
        records = await patientRecordDocuments(patientId);
    } catch (err) {
        console.warn('Patient record lookup failed:', err.message);
    }

    // Only surface history that the question plausibly touches, so a question
    // about a cough does not drag in an unrelated diagnosis from last year.
    const relevantRecords = records.filter(r => overlaps(query, r.pageContent)).slice(0, 2);
    const all = [...results, ...relevantRecords];

    if (!all.length) return { text: '', citations: [] };

    const text = all
        .map((doc, i) => `[${i + 1}] ${doc.metadata.title} — ${doc.metadata.source}\n${doc.pageContent}`)
        .join('\n\n');

    const citations = all.map((doc, i) => ({
        n: i + 1,
        kind: doc.metadata.kind,
        label: doc.metadata.source,
        title: doc.metadata.title,
        ...(doc.metadata.kind === 'medicine'
            ? {
                price: doc.metadata.price,
                inStock: doc.metadata.inStock,
                pharmacyId: doc.metadata.pharmacyId,
                medicineId: doc.metadata.sourceId,
                prescriptionRequired: doc.metadata.prescriptionRequired
              }
            : {})
    }));

    return { text, citations };
}

const STOP = new Set(['the', 'and', 'for', 'with', 'have', 'has', 'was', 'are', 'you', 'your', 'this', 'that', 'from', 'what', 'when', 'about', 'since', 'been']);

/** Cheap word overlap — enough to tell "my diabetes" from an unrelated record. */
function overlaps(query, text) {
    const words = String(query).toLowerCase().match(/[\p{L}]{4,}/gu) || [];
    const haystack = String(text).toLowerCase();
    return words.some(w => !STOP.has(w) && haystack.includes(w));
}
