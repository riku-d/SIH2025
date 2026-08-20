import mongoose from 'mongoose';
import { FIRST_AID_CORPUS } from './corpus/firstAid.js';

/**
 * Turns our own collections into retrievable chunks.
 *
 * The medicine catalogue is the differentiator: an answer grounded here can
 * say "in stock at Sharma Medical, ₹18" rather than describing a medicine in
 * the abstract, because it is the same row the pharmacy screen reads.
 */

export function firstAidDocuments() {
    return FIRST_AID_CORPUS.map(entry => ({
        pageContent: `${entry.title}\n\n${entry.text}`,
        metadata: { kind: 'reference', sourceId: entry.id, title: entry.title, source: entry.source }
    }));
}

export async function medicineDocuments() {
    const db = mongoose.connection.db;
    const stocks = await db.collection('medicinestocks')
        .find({ isActive: { $ne: false } })
        .toArray();

    const pharmacies = await db.collection('pharmacies').find({}).toArray();
    const byId = new Map(pharmacies.map(p => [String(p._id), p]));

    return stocks.map(s => {
        const pharmacy = byId.get(String(s.pharmacyId));
        const price = s.discount ? Math.round((s.price - (s.price * s.discount) / 100) * 100) / 100 : s.price;
        const availability = s.quantity === 0 ? 'out of stock'
            : s.quantity <= (s.minQuantity ?? 5) ? 'low stock'
            : 'in stock';

        const lines = [
            `${s.medicineName}${s.genericName ? ` (generic: ${s.genericName})` : ''}`,
            s.brand && `Brand: ${s.brand}`,
            s.form && `Form: ${s.form}`,
            s.category && `Category: ${s.category}`,
            s.description && `About: ${s.description}`,
            s.dosage && `Pack strength as listed: ${s.dosage}`,
            `Price: ₹${price}${s.mrp && s.mrp !== price ? ` (MRP ₹${s.mrp})` : ''}`,
            `Availability: ${availability}`,
            pharmacy?.name && `Stocked at: ${pharmacy.name}${pharmacy.address ? `, ${pharmacy.address}` : ''}`,
            s.prescriptionRequired ? 'A doctor\'s prescription is required for this medicine.' : 'Available without prescription.'
        ].filter(Boolean);

        return {
            pageContent: lines.join('\n'),
            metadata: {
                kind: 'medicine',
                sourceId: String(s._id),
                title: s.medicineName,
                source: pharmacy?.name || 'Pharmacy stock',
                pharmacyId: String(s.pharmacyId || ''),
                price,
                inStock: s.quantity > 0,
                prescriptionRequired: Boolean(s.prescriptionRequired)
            }
        };
    });
}

/**
 * The patient's own history. Recent entries by metadata filter rather than
 * a full vectorisation of every record: it is cheaper, and it keeps the
 * blast radius small if scoping ever goes wrong.
 */
export async function patientRecordDocuments(patientId) {
    if (!patientId) return [];
    const db = mongoose.connection.db;

    const records = await db.collection('healthrecords')
        .find({ patientId: new mongoose.Types.ObjectId(String(patientId)) })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

    return records.map(r => ({
        pageContent: [
            `Diagnosis recorded by a doctor: ${r.diagnosis}`,
            r.prescription && `Prescription given: ${r.prescription}`,
            `Date: ${new Date(r.createdAt).toISOString().slice(0, 10)}`
        ].filter(Boolean).join('\n'),
        metadata: {
            kind: 'record',
            sourceId: String(r._id),
            title: 'Your health record',
            source: `Your record, ${new Date(r.createdAt).toISOString().slice(0, 10)}`,
            patientId: String(patientId)
        }
    }));
}
