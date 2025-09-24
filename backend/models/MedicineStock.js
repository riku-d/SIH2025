import mongoose from 'mongoose';

const medicineStockSchema = new mongoose.Schema({
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

medicineStockSchema.index({ pharmacyId: 1, medicineName: 1 }, { unique: true });

export default mongoose.model('MedicineStock', medicineStockSchema);


