import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    contact: { type: String }
}, { timestamps: true });

export default mongoose.model('Pharmacy', pharmacySchema);


