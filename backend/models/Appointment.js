import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedDate: { type: Date, required: true }, // Date requested by patient
    confirmedDate: { type: Date }, // Date confirmed by doctor (can be same as requested)
    timeSlot: { type: String }, // Time slot assigned by doctor (e.g., "09:00-10:00")
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    symptoms: { type: String }, // Patient's symptoms/reason for visit
    consultationType: { type: String, enum: ['video', 'chat'], default: 'video' },
    doctorNotes: { type: String }, // Doctor's notes after confirmation/consultation
    patientNotes: { type: String }, // Patient's notes
    rejectionReason: { type: String } // Reason if doctor rejects the appointment
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);


