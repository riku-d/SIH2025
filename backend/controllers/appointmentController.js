import Appointment from '../models/Appointment.js';
import { SLOTS, isValidSlot } from '../config/slots.js';

export const bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, requestedDate, symptoms, consultationType, timeSlot } = req.body;
        
        // Validate required fields
        if (!patientId || !doctorId || !requestedDate) {
            return res.status(400).json({ 
                message: 'Missing required fields: patientId, doctorId, or requestedDate' 
            });
        }

        // The patient now asks for a specific hour, not just a day. Optional,
        // so older clients that only send a date still work.
        if (timeSlot && !isValidSlot(timeSlot)) {
            return res.status(400).json({ message: 'Unknown time slot' });
        }
        
        // Process uploaded attachments if any
        const attachments = [];
        if (req.files && req.files.length > 0) {
            console.log(`Processing ${req.files.length} uploaded files:`);
            req.files.forEach((file, index) => {
                console.log(`File ${index + 1}:`, {
                    originalname: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path
                });
                
                attachments.push({
                    type: file.mimetype.startsWith('video') ? 'video' : 'audio',
                    fileName: file.originalname,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    filename: file.filename // Add the server filename for serving
                });
            });
        }
        
        console.log('Prepared attachments for DB:', attachments);
        
        // Create appointment with pending status
        const appointmentData = {
            patientId,
            doctorId,
            requestedDate: new Date(requestedDate),
            symptoms: symptoms || '',
            consultationType: consultationType || 'video',
            status: 'pending',
            attachments
        };

        // The requested hour is the whole point of the patient picking a slot:
        // without it stored, the doctor has nothing to accept in one tap.
        if (timeSlot) appointmentData.timeSlot = timeSlot;
        
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
        const { doctorNotes } = req.body;

        const requested = await Appointment.findById(id);
        if (!requested) return res.status(404).json({ message: 'Appointment not found' });

        /**
         * Accepting what the patient asked for is the common case, so the
         * doctor should not have to retype it. An empty body means "as
         * requested"; supplying a date or slot means "at this time instead".
         */
        const confirmedDate = req.body.confirmedDate || requested.requestedDate;
        const timeSlot = req.body.timeSlot || requested.timeSlot;

        if (timeSlot && !isValidSlot(timeSlot)) {
            return res.status(400).json({ message: 'Unknown time slot' });
        }

        // Check if the time slot is already booked for this doctor on this date
        const existingAppointment = await Appointment.findOne({
            _id: { $ne: id },
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

// New function to mark appointment as completed
export const completeAppointment = async (req, res) => {
    try {
        const { id } = req.params; // appointment ID
        const { doctorNotes } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            {
                status: 'completed',
                doctorNotes
            },
            { new: true }
        ).populate('patientId', 'name age village email')
         .populate('doctorId', 'name specialization qualification');
        
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        
        res.json({
            message: 'Appointment marked as completed',
            appointment
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};



// Lets a patient withdraw a request the doctor hasn't acted on yet.
// The `cancelled` status already existed in the schema but had no route,
// so the UI's Cancel button 404'd and stale requests piled up in every
// doctor's queue.
export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Only the patient who booked it may cancel it.
        if (String(appointment.patientId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You can only cancel your own appointments' });
        }

        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return res.status(400).json({ message: `An appointment that is already ${appointment.status} cannot be cancelled` });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        const populated = await Appointment.findById(id)
            .populate('doctorId', 'name specialization qualification')
            .populate('patientId', 'name age village email');

        res.json({ message: 'Appointment cancelled', appointment: populated });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


/**
 * Which slots a doctor still has free on a given day.
 *
 * Without this the patient picks a time blind and the doctor counter-proposes
 * another — two round trips, on connections where each one is expensive.
 */
export const getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'date is required' });

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        // Pending requests hold a slot too — offering it to someone else
        // would just create a clash the doctor has to resolve by hand.
        const busy = await Appointment.find({
            doctorId,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                { confirmedDate: { $gte: dayStart, $lt: dayEnd } },
                { confirmedDate: null, requestedDate: { $gte: dayStart, $lt: dayEnd } }
            ]
        }).select('timeSlot').lean();

        const taken = new Set(busy.map(a => a.timeSlot).filter(Boolean));
        const now = new Date();

        res.json({
            date,
            slots: SLOTS.map(slot => {
                const start = new Date(dayStart);
                const [h, m] = slot.split('-')[0].split(':').map(Number);
                start.setHours(h, m, 0, 0);
                return {
                    slot,
                    available: !taken.has(slot) && start > now
                };
            })
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
