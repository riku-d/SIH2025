import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { getStore, ensureVectorIndex, storeMode, COLLECTION } from './store.js';
import { firstAidDocuments, medicineDocuments } from './documents.js';

dotenv.config();

/**
 * Rebuilds the shared knowledge index: curated reference plus the live
 * medicine catalogue. Run after seeding, and again whenever pharmacy stock
 * changes enough to matter.
 *
 *   npm run rag:ingest
 *
 * Patient records are deliberately absent — they are read per request and
 * scoped by patientId, never pooled into a shared index.
 */
async function main() {
    await connectDB();

    try {
        const status = await ensureVectorIndex();
        console.log(`Vector index: ${status}`);
    } catch (err) {
        console.warn(`Could not create the vector index (${err.codeName || err.message}).`);
        console.warn('Falling back to the in-memory store at runtime.');
    }

    const docs = [...firstAidDocuments(), ...await medicineDocuments()];
    console.log(`Prepared ${docs.length} chunks (${firstAidDocuments().length} reference, ${docs.length - firstAidDocuments().length} medicine).`);

    const store = await getStore();
    if (storeMode() === 'atlas') {
        await mongoose.connection.db.collection(COLLECTION).deleteMany({ 'metadata.kind': { $in: ['reference', 'medicine'] } });
        await mongoose.connection.db.collection(COLLECTION).deleteMany({ kind: { $in: ['reference', 'medicine'] } });
    }

    // Batched: embedding 200 chunks in one call is a single point of failure
    // and a large request on a connection that may not be good.
    const BATCH = 20;
    for (let i = 0; i < docs.length; i += BATCH) {
        await store.addDocuments(docs.slice(i, i + BATCH));
        console.log(`  embedded ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
    }

    console.log(`Done. Store mode: ${storeMode()}.`);
    if (storeMode() === 'atlas') console.log('Atlas builds the index asynchronously — searches may be empty for a minute.');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
