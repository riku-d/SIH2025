import Appointment from '../models/Appointment.js';
import User from '../models/User.js'; // Added import for User

export const bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, requestedDate, symptoms, consultationType } = req.body;
        
        // Validate required fields
        if (!patientId || !doctorId || !requestedDate) {
            return res.status(400).json({ 
                message: 'Missing required fields: patientId, doctorId, or requestedDate' 
            });
        }
        
        // Create appointment with pending status
        const appointmentData = {
            patientId,
            doctorId,
            requestedDate: new Date(requestedDate),
            symptoms: symptoms || '',
            consultationType: consultationType || 'video',
            status: 'pending'
        };
        
        const appointment = await Appointment.create(appointmentData);
        
        // Populate doctor and patient details for response
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('doctorId', 'name specialization qualification')
            .populate('patientId', 'name age village');
        
        res.status(201).json({
            message: 'Appointment request submitted successfully. The doctor will review and confirm your appointment.',
            appointment: populatedAppointment
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAppointmentsForPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const appointments = await Appointment.find({ patientId: id })
            .populate('doctorId', 'name specialization qualification availability')
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAppointmentsForDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const appointments = await Appointment.find({ doctorId: id })
            .populate('patientId', 'name age village email')
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// New function to confirm appointment by doctor
export const confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params; // appointment ID
        const { confirmedDate, timeSlot, doctorNotes } = req.body;
        
        // Find the doctor's availability
        const doctor = await User.findById(req.user.id).select('availability');
        if (!doctor || !doctor.availability || doctor.availability.length === 0) {
            return res.status(400).json({ message: 'Doctor availability not set.' });
        }

        const confirmedDay = new Date(confirmedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const [selectedSlotStart, selectedSlotEnd] = timeSlot.split('-');

        const availableSlot = doctor.availability.find(
            slot => {
                if (slot.day.toLowerCase() !== confirmedDay) return false;

                const doctorStartTime = new Date(`2000-01-01T${slot.startTime}:00`);
                const doctorEndTime = new Date(`2000-01-01T${slot.endTime}:00`);
                const appointmentStartTime = new Date(`2000-01-01T${selectedSlotStart}:00`);
                const appointmentEndTime = new Date(`2000-01-01T${selectedSlotEnd}:00`);

                return appointmentStartTime >= doctorStartTime && appointmentEndTime <= doctorEndTime;
            }
        );

        if (!availableSlot) {
            return res.status(400).json({ message: 'Selected date or time slot is outside your set availability.' });
        }

        // Check if the time slot is already booked for this doctor on this date
        const existingAppointment = await Appointment.findOne({
            doctorId: req.user.id,
            confirmedDate: new Date(confirmedDate),
            timeSlot,
            status: 'confirmed'
        });
        
        if (existingAppointment) {
            return res.status(400).json({ 
                message: 'This time slot is already booked for the selected date.' 
            });
        }
        
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            {
                status: 'confirmed',
                confirmedDate: new Date(confirmedDate),
                timeSlot,
                doctorNotes
            },
            { new: true }
        ).populate('patientId', 'name age village email')
         .populate('doctorId', 'name specialization qualification');
        
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        
        res.json({
            message: 'Appointment confirmed successfully',
            appointment
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// New function to reject appointment by doctor
export const rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params; // appointment ID
        const { rejectionReason } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            {
                status: 'rejected',
                rejectionReason
            },
            { new: true }
        ).populate('patientId', 'name age village email')
         .populate('doctorId', 'name specialization qualification');
        
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        
        res.json({
            message: 'Appointment rejected',
            appointment
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


