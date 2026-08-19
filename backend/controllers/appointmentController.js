import Appointment from '../models/Appointment.js';

export const bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, requestedDate, symptoms, consultationType } = req.body;
        
        // Validate required fields
        if (!patientId || !doctorId || !requestedDate) {
            return res.status(400).json({ 
                message: 'Missing required fields: patientId, doctorId, or requestedDate' 
            });
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
