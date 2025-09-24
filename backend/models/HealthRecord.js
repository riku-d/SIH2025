import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    diagnosis: { type: String, required: true },
    prescription: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('HealthRecord', healthRecordSchema);


